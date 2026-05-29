-- ShopMecko backend fixes for an existing Supabase project.
-- Run in Supabase Dashboard > SQL Editor after reviewing against your live data.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'field_agent';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_agent_allowed_roles user_role[] DEFAULT '{}';

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS car_id uuid REFERENCES cars(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Service role can manage wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;
CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage verifications" ON id_verifications;
DROP POLICY IF EXISTS "Users can submit their own verification" ON id_verifications;
DROP POLICY IF EXISTS "Users can resubmit their own verification" ON id_verifications;
DROP POLICY IF EXISTS "Admins can manage verifications" ON id_verifications;
CREATE POLICY "Users can submit their own verification"
  ON id_verifications FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can resubmit their own verification"
  ON id_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage verifications"
  ON id_verifications FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can create violations" ON violations;
CREATE POLICY "Admins can create violations"
  ON violations FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
    AND COALESCE(auth.role(), '') <> 'service_role'
    AND NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  THEN
    RAISE EXCEPTION 'Only admins can change profile roles';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_role_escalation();

CREATE OR REPLACE FUNCTION hold_escrow_payment(
  p_reference text,
  p_related_type text,
  p_related_id uuid,
  p_payer_id uuid,
  p_payee_id uuid,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_existing_id uuid;
  v_escrow_id uuid;
  v_expected_amount numeric;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  IF p_reference IS NULL OR length(trim(p_reference)) = 0 THEN
    RAISE EXCEPTION 'Missing Paystack reference';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  IF p_related_type = 'booking' THEN
    SELECT agreed_price INTO v_expected_amount
    FROM bookings
    WHERE id = p_related_id
      AND customer_id = p_payer_id
      AND repairer_id = p_payee_id
      AND payment_status = 'unpaid'
    FOR UPDATE;
  ELSIF p_related_type = 'order' THEN
    SELECT total_price INTO v_expected_amount
    FROM orders
    WHERE id = p_related_id
      AND buyer_id = p_payer_id
      AND seller_id = p_payee_id
      AND payment_status = 'unpaid'
    FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'Invalid escrow related type';
  END IF;

  SELECT id INTO v_existing_id
  FROM escrow_payments
  WHERE paystack_ref = p_reference;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('already_processed', true, 'escrow_id', v_existing_id);
  END IF;

  IF v_expected_amount IS NULL THEN
    RAISE EXCEPTION 'Payable record not found or already paid';
  END IF;

  IF v_expected_amount <> p_amount THEN
    RAISE EXCEPTION 'Payment amount does not match payable record';
  END IF;

  INSERT INTO escrow_payments (
    payer_id,
    payee_id,
    amount,
    paystack_ref,
    status,
    related_type,
    related_id
  )
  VALUES (
    p_payer_id,
    p_payee_id,
    p_amount,
    p_reference,
    'held',
    p_related_type,
    p_related_id
  )
  ON CONFLICT (paystack_ref) DO NOTHING
  RETURNING id INTO v_escrow_id;

  IF v_escrow_id IS NULL THEN
    SELECT id INTO v_existing_id
    FROM escrow_payments
    WHERE paystack_ref = p_reference;

    RETURN jsonb_build_object('already_processed', true, 'escrow_id', v_existing_id);
  END IF;

  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    description,
    related_type,
    related_id
  )
  VALUES (
    p_payer_id,
    'escrow_hold',
    p_amount,
    'Payment held in escrow for ' || p_related_type || ' #' || left(p_related_id::text, 8),
    p_related_type,
    p_related_id
  );

  IF p_related_type = 'booking' THEN
    UPDATE bookings SET payment_status = 'in_escrow' WHERE id = p_related_id;
  ELSE
    UPDATE orders SET payment_status = 'in_escrow' WHERE id = p_related_id;
  END IF;

  RETURN jsonb_build_object('already_processed', false, 'escrow_id', v_escrow_id);
END;
$$;

CREATE OR REPLACE FUNCTION release_escrow_payment(
  p_escrow_id uuid,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_escrow escrow_payments%ROWTYPE;
  v_wallet_id uuid;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT * INTO v_escrow
  FROM escrow_payments
  WHERE id = p_escrow_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow payment not found';
  END IF;

  IF v_escrow.status <> 'held' THEN
    RAISE EXCEPTION 'Payment is not in held status';
  END IF;

  INSERT INTO wallets (user_id, balance)
  VALUES (v_escrow.payee_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE wallets
  SET balance = balance + v_escrow.amount,
      updated_at = now()
  WHERE user_id = v_escrow.payee_id
  RETURNING id INTO v_wallet_id;

  INSERT INTO wallet_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    description,
    related_type,
    related_id
  )
  VALUES (
    v_escrow.payee_id,
    v_wallet_id,
    'escrow_release',
    v_escrow.amount,
    'Released from escrow for ' || v_escrow.related_type || ' #' || left(v_escrow.related_id::text, 8),
    v_escrow.related_type,
    v_escrow.related_id
  );

  UPDATE escrow_payments
  SET status = 'released',
      released_at = now()
  WHERE id = v_escrow.id;

  IF v_escrow.related_type = 'booking' THEN
    UPDATE bookings SET payment_status = 'released' WHERE id = v_escrow.related_id;
  ELSIF v_escrow.related_type = 'order' THEN
    UPDATE orders SET payment_status = 'released' WHERE id = v_escrow.related_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION approve_withdrawal_request(
  p_request_id uuid,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_request withdrawal_requests%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT * INTO v_request
  FROM withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending';
  END IF;

  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = v_request.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet.balance < v_request.amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance for this withdrawal';
  END IF;

  UPDATE wallets
  SET balance = balance - v_request.amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO wallet_transactions (
    user_id,
    wallet_id,
    type,
    amount,
    description,
    related_type,
    related_id
  )
  VALUES (
    v_request.user_id,
    v_wallet.id,
    'withdrawal',
    v_request.amount,
    'Withdrawal to bank account (Request #' || left(v_request.id::text, 8) || ')',
    'withdrawal_request',
    v_request.id
  );

  UPDATE withdrawal_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_admin_id
  WHERE id = v_request.id;
END;
$$;

REVOKE ALL ON FUNCTION hold_escrow_payment(text, text, uuid, uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_escrow_payment(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION approve_withdrawal_request(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION hold_escrow_payment(text, text, uuid, uuid, uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION release_escrow_payment(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION approve_withdrawal_request(uuid, uuid) TO service_role;

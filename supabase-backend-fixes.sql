-- ShopMecko backend fixes for an existing Supabase project.
-- Run in Supabase Dashboard > SQL Editor after reviewing against your live data.

-- ── Missing tables ──────────────────────────────────────────────
-- Your live project only had: profiles, repairer_details, products, orders,
-- conversations, messages, reviews, cars, bookings, wallets, escrow_payments,
-- wallet_transactions. Everything below was in supabase-schema.sql but was
-- never actually created here, so every feature that depends on these tables
-- (notifications, ID verification, disputes, reports, withdrawals, violations,
-- appeals) has been silently failing in production. This block is idempotent
-- — safe to run even if some of these already exist.

DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount        numeric NOT NULL,
  status        withdrawal_status NOT NULL DEFAULT 'pending',
  bank_account  text,
  bank_name     text,
  account_holder text,
  reason        text,
  admin_notes   text,
  reviewed_at   timestamptz,
  reviewed_by   uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view and manage all withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Admins can view and manage all withdrawal requests"
  ON withdrawal_requests FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('booking_request', 'booking_confirmed', 'booking_completed', 'message', 'order_update', 'payment_released', 'withdrawal_approved', 'withdrawal_rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type           notification_type NOT NULL,
  title          text NOT NULL,
  body           text,
  data           jsonb DEFAULT '{}',
  related_id     uuid,
  is_read        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;
CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS phone_otp_verifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  otp_code     text NOT NULL,
  is_verified  boolean NOT NULL DEFAULT false,
  attempts     int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);
ALTER TABLE phone_otp_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own OTP records" ON phone_otp_verifications;
CREATE POLICY "Users can view their own OTP records"
  ON phone_otp_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS phone_otp_user_idx ON phone_otp_verifications(user_id);

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS id_verifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  id_type               text NOT NULL,
  id_number             text NOT NULL,
  id_image_url          text,
  gov_registration_url  text,
  status                verification_status NOT NULL DEFAULT 'pending',
  verified_at           timestamptz,
  expired_at            timestamptz,
  rejection_reason      text,
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_by           uuid REFERENCES profiles(id)
);
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own verification" ON id_verifications;
CREATE POLICY "Users can view their own verification"
  ON id_verifications FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE INDEX IF NOT EXISTS id_verifications_user_idx ON id_verifications(user_id);
CREATE INDEX IF NOT EXISTS id_verifications_status_idx ON id_verifications(status);

CREATE TABLE IF NOT EXISTS trust_scores (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_verified      boolean NOT NULL DEFAULT false,
  phone_verified      boolean NOT NULL DEFAULT false,
  id_verified         boolean NOT NULL DEFAULT false,
  completion_rate     numeric DEFAULT 0,
  rating_average      numeric DEFAULT 0,
  total_transactions  int DEFAULT 0,
  dispute_count       int DEFAULT 0,
  violation_count     int DEFAULT 0,
  trust_score         numeric DEFAULT 0,
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trust scores are viewable by everyone" ON trust_scores;
CREATE POLICY "Trust scores are viewable by everyone"
  ON trust_scores FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS trust_scores_user_idx ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS trust_scores_score_idx ON trust_scores(trust_score DESC);

CREATE TABLE IF NOT EXISTS user_blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their blocks" ON user_blocks;
CREATE POLICY "Users can view their blocks"
  ON user_blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
DROP POLICY IF EXISTS "Users can manage their blocks" ON user_blocks;
CREATE POLICY "Users can manage their blocks"
  ON user_blocks FOR ALL USING (auth.uid() = blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks(blocked_id);

DO $$ BEGIN
  CREATE TYPE report_type AS ENUM ('user', 'product', 'review', 'message');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type    report_type NOT NULL,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reported_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  reason         text NOT NULL,
  description    text,
  status         report_status NOT NULL DEFAULT 'open',
  evidence_urls  text[] DEFAULT '{}',
  reviewed_by    uuid REFERENCES profiles(id),
  admin_notes    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view reports they filed" ON reports;
CREATE POLICY "Users can view reports they filed"
  ON reports FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
CREATE POLICY "Admins can manage reports"
  ON reports FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_created_idx ON reports(created_at DESC);

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'appealed', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE dispute_type AS ENUM ('refund_request', 'quality_issue', 'service_incomplete', 'payment_issue', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES profiles(id),
  service_provider_id uuid NOT NULL REFERENCES profiles(id),
  related_type    text NOT NULL,
  related_id      uuid NOT NULL,
  type            dispute_type NOT NULL,
  title           text NOT NULL,
  description     text NOT NULL,
  status          dispute_status NOT NULL DEFAULT 'open',
  resolution      text,
  refund_amount   numeric,
  evidence_urls   text[] DEFAULT '{}',
  assigned_to     uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Party members can view their disputes" ON disputes;
CREATE POLICY "Party members can view their disputes"
  ON disputes FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = service_provider_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Users can create disputes" ON disputes;
CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Admins can manage disputes" ON disputes;
CREATE POLICY "Admins can manage disputes"
  ON disputes FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE INDEX IF NOT EXISTS disputes_customer_idx ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS disputes_provider_idx ON disputes(service_provider_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON disputes(status);
CREATE INDEX IF NOT EXISTS disputes_created_idx ON disputes(created_at DESC);

CREATE TABLE IF NOT EXISTS dispute_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id   uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES profiles(id),
  content      text NOT NULL,
  attachments  text[] DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dispute parties can view messages" ON dispute_messages;
CREATE POLICY "Dispute parties can view messages"
  ON dispute_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_id AND (d.customer_id = auth.uid() OR d.service_provider_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    )
  );
DROP POLICY IF EXISTS "Dispute parties can send messages" ON dispute_messages;
CREATE POLICY "Dispute parties can send messages"
  ON dispute_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE INDEX IF NOT EXISTS dispute_messages_dispute_idx ON dispute_messages(dispute_id);

DO $$ BEGIN
  CREATE TYPE violation_type AS ENUM ('fraud', 'harassment', 'poor_quality', 'policy_violation', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE suspension_status AS ENUM ('active', 'appealed', 'upheld', 'lifted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS violations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            violation_type NOT NULL,
  description     text NOT NULL,
  severity        int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  suspension_days int,
  manual_review   boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz
);
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their violations" ON violations;
CREATE POLICY "Users can view their violations"
  ON violations FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Admins can create violations" ON violations;
CREATE POLICY "Admins can create violations"
  ON violations FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE INDEX IF NOT EXISTS violations_user_idx ON violations(user_id);
CREATE INDEX IF NOT EXISTS violations_created_idx ON violations(created_at DESC);

CREATE TABLE IF NOT EXISTS appeals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  violation_id  uuid NOT NULL REFERENCES violations(id),
  reason        text NOT NULL,
  description   text,
  status        suspension_status NOT NULL DEFAULT 'appealed',
  admin_response text,
  reviewed_by   uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their appeals" ON appeals;
CREATE POLICY "Users can view their appeals"
  ON appeals FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Users can create appeals" ON appeals;
CREATE POLICY "Users can create appeals"
  ON appeals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage appeals" ON appeals;
CREATE POLICY "Admins can manage appeals"
  ON appeals FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE INDEX IF NOT EXISTS appeals_user_idx ON appeals(user_id);
CREATE INDEX IF NOT EXISTS appeals_status_idx ON appeals(status);

-- ── End missing tables ──────────────────────────────────────────

-- Only applies if `profiles.role` is a Postgres enum named user_role.
-- Skipped automatically if role is a plain text column instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'field_agent';
  END IF;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- field_agent_allowed_roles: uses the user_role enum if profiles.role is an
-- enum, otherwise plain text[] (matches whichever type role actually is here).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'field_agent_allowed_roles'
  ) THEN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      ALTER TABLE profiles ADD COLUMN field_agent_allowed_roles user_role[] DEFAULT '{}';
    ELSE
      ALTER TABLE profiles ADD COLUMN field_agent_allowed_roles text[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

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

-- ── Admin product moderation ──────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all products" ON products;
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── Reviews: generic rating aggregate + admin moderation ───────
-- reviews.repairer_id stores the id of whoever is being reviewed (repairer
-- OR parts seller — no role CHECK on the column). profiles.rating/total_reviews
-- is the generic aggregate; repairer_details.rating/total_reviews stays in
-- sync too for backward compatibility with existing repairer-only pages.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews int DEFAULT 0;

CREATE OR REPLACE FUNCTION update_review_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_id uuid := COALESCE(NEW.repairer_id, OLD.repairer_id);
  avg_rating numeric;
  review_count int;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, review_count
  FROM reviews WHERE repairer_id = target_id;

  UPDATE profiles SET rating = avg_rating, total_reviews = review_count WHERE id = target_id;
  UPDATE repairer_details SET rating = avg_rating, total_reviews = review_count WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_rating();

DROP POLICY IF EXISTS "Admins can delete reviews" ON reviews;
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── Push notifications (Web Push / VAPID) ──────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage their own push subscriptions"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

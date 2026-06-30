-- ============================================================
-- ShopMecko — Supabase SQL Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Enums ─────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('car_owner', 'repairer', 'parts_seller', 'field_agent', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- ── 2. Profiles (extends auth.users) ─────────────────────────
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'car_owner',
  full_name   text,
  phone       text,
  avatar_url  text,
  bio         text,
  address     text,
  city        text,
  state       text,
  latitude    float,
  longitude   float,
  is_verified   boolean NOT NULL DEFAULT false,
  is_suspended  boolean NOT NULL DEFAULT false,
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  field_agent_allowed_roles user_role[] DEFAULT '{}',
  shop_images   text[] DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

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

CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_role_escalation();

-- ── 3. Auto-create profile on sign-up ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'car_owner')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. Repairer details ───────────────────────────────────────
CREATE TABLE repairer_details (
  id                uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specializations   text[] DEFAULT '{}',
  years_experience  int,
  rating            float DEFAULT 0,
  total_reviews     int DEFAULT 0,
  is_available      boolean DEFAULT true,
  workshop_name     text,
  workshop_images   text[] DEFAULT '{}',
  hourly_rate       numeric,
  job_title         text,
  fixed_price       numeric,
  inspection_fee    numeric,
  vehicle_brands    text[] DEFAULT '{}',
  services          text[] DEFAULT '{}',
  service_modes     text[] DEFAULT '{workshop}',
  available_days    text[] DEFAULT '{}',
  available_from    text DEFAULT '08:00',
  available_to      text DEFAULT '18:00',
  completed_jobs    int DEFAULT 0
);

ALTER TABLE repairer_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Repairer details viewable by everyone"
  ON repairer_details FOR SELECT USING (true);

CREATE POLICY "Repairers can manage their own details"
  ON repairer_details FOR ALL USING (auth.uid() = id);

-- ── 5. Products ───────────────────────────────────────────────
CREATE TABLE products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  price            numeric NOT NULL,
  stock_quantity   int NOT NULL DEFAULT 0,
  category         text,
  condition        text DEFAULT 'New',
  brand            text,
  compatible_cars  text[] DEFAULT '{}',
  images           text[] DEFAULT '{}',
  street           text,
  city             text,
  state            text,
  is_active        boolean DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT USING (is_active = true OR auth.uid() = seller_id);

CREATE POLICY "Sellers can manage own products"
  ON products FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all products"
  ON products FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── 6. Orders ────────────────────────────────────────────────
CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id        uuid NOT NULL REFERENCES profiles(id),
  product_id       uuid NOT NULL REFERENCES products(id),
  quantity         int NOT NULL DEFAULT 1,
  total_price      numeric NOT NULL,
  status           order_status NOT NULL DEFAULT 'pending',
  delivery_address text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers and sellers can view their orders"
  ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status"
  ON orders FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- ── 7. Conversations ─────────────────────────────────────────
CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_1, participant_2)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ── 8. Messages ──────────────────────────────────────────────
CREATE TABLE messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content           text NOT NULL,
  is_read           boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- ── 9. Reviews ───────────────────────────────────────────────
CREATE TABLE reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repairer_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating        int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repairer_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Car owners can leave reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── 10. Auto-update reviewee rating on review change ──────────
-- `reviews.repairer_id` despite its name stores the id of whoever is being
-- reviewed (repairer or parts seller) — there is no role CHECK on the column.
-- profiles.rating/total_reviews is the generic aggregate used everywhere;
-- repairer_details.rating/total_reviews is kept in sync too for backward
-- compatibility with existing repairer-specific pages.
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
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_rating();

-- ── 11. Enable Realtime for messages ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ── 12. Storage bucket for avatars / product images ──────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shops', 'shops', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', true)
ON CONFLICT DO NOTHING;

-- ── 13. Cars ─────────────────────────────────────────────────
CREATE TABLE cars (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make         text NOT NULL,
  model        text NOT NULL,
  year         int NOT NULL,
  color        text,
  plate_number text,
  mileage      int,
  description  text,
  images       text[] DEFAULT '{}',
  is_public    boolean DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public cars are viewable by everyone"
  ON cars FOR SELECT USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Car owners can manage their own cars"
  ON cars FOR ALL USING (auth.uid() = owner_id);

-- Storage bucket for car images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cars', 'cars', true)
ON CONFLICT DO NOTHING;

-- ── 14. Bookings ─────────────────────────────────────────────
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repairer_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  car_id         uuid REFERENCES cars(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  description    text NOT NULL,
  photos         text[] DEFAULT '{}',
  status         booking_status NOT NULL DEFAULT 'pending',
  agreed_price   numeric,
  payment_status text NOT NULL DEFAULT 'unpaid',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their bookings"
  ON bookings FOR SELECT USING (auth.uid() = repairer_id OR auth.uid() = customer_id);

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE USING (auth.uid() = repairer_id OR auth.uid() = customer_id);

-- ── 15. Wallets ───────────────────────────────────────────────
CREATE TABLE wallets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance     numeric NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── 16. Escrow payments ───────────────────────────────────────
CREATE TYPE payment_status AS ENUM ('pending', 'held', 'released', 'refunded');

CREATE TABLE escrow_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id      uuid NOT NULL REFERENCES profiles(id),
  payee_id      uuid NOT NULL REFERENCES profiles(id),
  amount        numeric NOT NULL,
  paystack_ref  text UNIQUE,
  status        payment_status NOT NULL DEFAULT 'pending',
  related_type  text NOT NULL,
  related_id    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  released_at   timestamptz
);

ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payer and payee can view their escrow payments"
  ON escrow_payments FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- ── 17. Wallet transactions ───────────────────────────────────
CREATE TYPE transaction_type AS ENUM ('escrow_hold', 'escrow_release', 'withdrawal');

CREATE TABLE wallet_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id),
  wallet_id     uuid REFERENCES wallets(id),
  type          transaction_type NOT NULL,
  amount        numeric NOT NULL,
  description   text,
  related_type  text,
  related_id    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Add payment_status to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- ── 18. Withdrawal requests ─────────────────────────────────
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

CREATE TABLE withdrawal_requests (
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

CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all withdrawal requests"
  ON withdrawal_requests FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ── 19. Notifications ────────────────────────────────────────
CREATE TYPE notification_type AS ENUM ('booking_request', 'booking_confirmed', 'booking_completed', 'message', 'order_update', 'payment_released', 'withdrawal_approved', 'withdrawal_rejected');

CREATE TABLE notifications (
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

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX notifications_created_idx ON notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── 19b. Push Subscriptions (Web Push) ───────────────────────
CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- ── 20. Phone OTP Verification ──────────────────────────────
CREATE TABLE phone_otp_verifications (
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

CREATE POLICY "Users can view their own OTP records"
  ON phone_otp_verifications FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX phone_otp_user_idx ON phone_otp_verifications(user_id);

-- ── 20. ID Verification ────────────────────────────────────
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

CREATE TABLE id_verifications (
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

CREATE POLICY "Users can view their own verification"
  ON id_verifications FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Users can submit their own verification"
  ON id_verifications FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can resubmit their own verification"
  ON id_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage verifications"
  ON id_verifications FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX id_verifications_user_idx ON id_verifications(user_id);
CREATE INDEX id_verifications_status_idx ON id_verifications(status);

-- ── 21. Trust Scores ────────────────────────────────────────
CREATE TABLE trust_scores (
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

CREATE POLICY "Trust scores are viewable by everyone"
  ON trust_scores FOR SELECT USING (true);

CREATE POLICY "Service role can manage trust scores"
  ON trust_scores FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX trust_scores_user_idx ON trust_scores(user_id);
CREATE INDEX trust_scores_score_idx ON trust_scores(trust_score DESC);

-- ── 22. User Blocks ────────────────────────────────────────
CREATE TABLE user_blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks"
  ON user_blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can manage their blocks"
  ON user_blocks FOR ALL USING (auth.uid() = blocker_id);

CREATE INDEX user_blocks_blocker_idx ON user_blocks(blocker_id);
CREATE INDEX user_blocks_blocked_idx ON user_blocks(blocked_id);

-- ── 23. Reports ────────────────────────────────────────────
CREATE TYPE report_type AS ENUM ('user', 'product', 'review', 'message');
CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

CREATE TABLE reports (
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

CREATE POLICY "Users can view reports they filed"
  ON reports FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports"
  ON reports FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX reports_reporter_idx ON reports(reporter_id);
CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_created_idx ON reports(created_at DESC);

-- ── 24. Disputes/Support Tickets ────────────────────────────
CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'appealed', 'closed');
CREATE TYPE dispute_type AS ENUM ('refund_request', 'quality_issue', 'service_incomplete', 'payment_issue', 'other');

CREATE TABLE disputes (
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

CREATE POLICY "Party members can view their disputes"
  ON disputes FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = service_provider_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can manage disputes"
  ON disputes FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX disputes_customer_idx ON disputes(customer_id);
CREATE INDEX disputes_provider_idx ON disputes(service_provider_id);
CREATE INDEX disputes_status_idx ON disputes(status);
CREATE INDEX disputes_created_idx ON disputes(created_at DESC);

-- ── 25. Dispute Messages ────────────────────────────────────
CREATE TABLE dispute_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id   uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES profiles(id),
  content      text NOT NULL,
  attachments  text[] DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dispute parties can view messages"
  ON dispute_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_id AND (d.customer_id = auth.uid() OR d.service_provider_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    )
  );

CREATE POLICY "Dispute parties can send messages"
  ON dispute_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE INDEX dispute_messages_dispute_idx ON dispute_messages(dispute_id);

-- ── 26. Violations & Suspensions ────────────────────────────
CREATE TYPE violation_type AS ENUM ('fraud', 'harassment', 'poor_quality', 'policy_violation', 'other');
CREATE TYPE suspension_status AS ENUM ('active', 'appealed', 'upheld', 'lifted');

CREATE TABLE violations (
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

CREATE POLICY "Users can view their violations"
  ON violations FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can create violations"
  ON violations FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX violations_user_idx ON violations(user_id);
CREATE INDEX violations_created_idx ON violations(created_at DESC);

-- ── 27. Appeals ─────────────────────────────────────────────
CREATE TABLE appeals (
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

CREATE POLICY "Users can view their appeals"
  ON appeals FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Users can create appeals"
  ON appeals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage appeals"
  ON appeals FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX appeals_user_idx ON appeals(user_id);
CREATE INDEX appeals_status_idx ON appeals(status);

-- ── 28. Transactional payment helpers ───────────────────────
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

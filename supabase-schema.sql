-- ============================================================
-- ShopMecko — Supabase SQL Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Enums ─────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('car_owner', 'repairer', 'parts_seller', 'admin');
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
  brand            text,
  compatible_cars  text[] DEFAULT '{}',
  images           text[] DEFAULT '{}',
  is_active        boolean DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT USING (is_active = true OR auth.uid() = seller_id);

CREATE POLICY "Sellers can manage own products"
  ON products FOR ALL USING (auth.uid() = seller_id);

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

-- ── 10. Auto-update repairer rating on review ────────────────
CREATE OR REPLACE FUNCTION update_repairer_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE repairer_details
  SET
    rating = (SELECT AVG(rating) FROM reviews WHERE repairer_id = NEW.repairer_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE repairer_id = NEW.repairer_id)
  WHERE id = NEW.repairer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_insert
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_repairer_rating();

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
  scheduled_date date NOT NULL,
  description    text NOT NULL,
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

CREATE POLICY "Service role can manage wallets"
  ON wallets FOR ALL USING (true);

-- ── 16. Escrow payments ───────────────────────────────────────
CREATE TYPE payment_status AS ENUM ('pending', 'held', 'released', 'refunded');

CREATE TABLE escrow_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id      uuid NOT NULL REFERENCES profiles(id),
  payee_id      uuid NOT NULL REFERENCES profiles(id),
  amount        numeric NOT NULL,
  paystack_ref  text,
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

-- ── 18. Notifications ────────────────────────────────────────
CREATE TYPE notification_type AS ENUM ('booking_request', 'booking_confirmed', 'booking_completed', 'message', 'order_update', 'payment_released');

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
  ON notifications FOR INSERT USING (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX notifications_created_idx ON notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


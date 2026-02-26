-- ═══════════════════════════════════════════════════════════
-- PETAL RUSH — Complete Supabase Setup
-- Run this ENTIRE file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('buyer','seller','delivery','admin')),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  address       TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_banned     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sellers (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  shop_name      TEXT NOT NULL,
  verified_status BOOLEAN DEFAULT FALSE,
  bank_details   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL CHECK (price > 0),
  quantity      INTEGER DEFAULT 0 CHECK (quantity >= 0),
  category      TEXT DEFAULT 'flowers',
  image_url     TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  auto_expire_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id            UUID REFERENCES public.users(id),
  seller_id           UUID REFERENCES public.users(id),
  product_id          UUID REFERENCES public.products(id),
  delivery_partner_id UUID REFERENCES public.users(id),
  quantity            INTEGER DEFAULT 1 CHECK (quantity > 0),
  total_amount        DECIMAL(10,2) NOT NULL,
  pickup_address      TEXT,
  drop_address        TEXT NOT NULL,
  payment_type        TEXT CHECK (payment_type IN ('online','cod')) DEFAULT 'online',
  payment_status      TEXT CHECK (payment_status IN ('pending','paid','released','returned','held')) DEFAULT 'pending',
  order_status        TEXT CHECK (order_status IN ('placed','assigned','picked','delivered','returned','cancelled')) DEFAULT 'placed',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id        UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id       UUID REFERENCES public.users(id),
  buyer_id        UUID REFERENCES public.users(id),
  amount          DECIMAL(10,2) NOT NULL,
  status          TEXT CHECK (status IN ('pending','admin_wallet','released','returned','held','cod_collected')) DEFAULT 'pending',
  payment_method  TEXT,
  transaction_id  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ── USERS ──
DROP POLICY IF EXISTS "users_read_own"    ON public.users;
DROP POLICY IF EXISTS "users_update_own"  ON public.users;
DROP POLICY IF EXISTS "users_insert_own"  ON public.users;
DROP POLICY IF EXISTS "users_admin_all"   ON public.users;

CREATE POLICY "users_insert_own"  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_read_own"    ON public.users FOR SELECT USING (auth.uid() = id OR current_user_role() = 'admin');
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id OR current_user_role() = 'admin');
CREATE POLICY "users_admin_all"   ON public.users FOR DELETE USING (current_user_role() = 'admin');

-- ── SELLERS ──
DROP POLICY IF EXISTS "sellers_manage_own" ON public.sellers;
DROP POLICY IF EXISTS "sellers_public_read" ON public.sellers;

CREATE POLICY "sellers_manage_own"  ON public.sellers FOR ALL USING (user_id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "sellers_public_read" ON public.sellers FOR SELECT USING (TRUE);

-- ── PRODUCTS ──
DROP POLICY IF EXISTS "products_public_view"  ON public.products;
DROP POLICY IF EXISTS "products_seller_manage" ON public.products;
DROP POLICY IF EXISTS "products_admin"        ON public.products;

CREATE POLICY "products_public_view"   ON public.products FOR SELECT USING (is_active = TRUE OR seller_id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "products_seller_manage" ON public.products FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "products_admin"         ON public.products FOR ALL USING (current_user_role() = 'admin');

-- ── ORDERS ──
DROP POLICY IF EXISTS "orders_buyer_view"    ON public.orders;
DROP POLICY IF EXISTS "orders_buyer_insert"  ON public.orders;
DROP POLICY IF EXISTS "orders_seller_view"   ON public.orders;
DROP POLICY IF EXISTS "orders_delivery_view" ON public.orders;
DROP POLICY IF EXISTS "orders_delivery_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin"         ON public.orders;

CREATE POLICY "orders_buyer_insert"    ON public.orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_buyer_view"      ON public.orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "orders_seller_view"     ON public.orders FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "orders_delivery_view"   ON public.orders FOR SELECT USING (delivery_partner_id = auth.uid());
CREATE POLICY "orders_delivery_update" ON public.orders FOR UPDATE USING (delivery_partner_id = auth.uid());
CREATE POLICY "orders_admin"           ON public.orders FOR ALL USING (current_user_role() = 'admin');
-- Buyers can update (for returns)
CREATE POLICY "orders_buyer_update"    ON public.orders FOR UPDATE USING (buyer_id = auth.uid());

-- ── PAYMENTS ──
DROP POLICY IF EXISTS "payments_own_view"  ON public.payments;
DROP POLICY IF EXISTS "payments_admin"     ON public.payments;
DROP POLICY IF EXISTS "payments_buyer_insert" ON public.payments;

CREATE POLICY "payments_own_view"     ON public.payments FOR SELECT USING (seller_id = auth.uid() OR buyer_id = auth.uid());
CREATE POLICY "payments_buyer_insert" ON public.payments FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "payments_admin"        ON public.payments FOR ALL USING (current_user_role() = 'admin');

-- ── NOTIFICATIONS ──
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- STORAGE — Avatar Bucket
-- ═══════════════════════════════════════════

-- Create the avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,  -- 2MB limit
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═══════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at   BEFORE UPDATE ON public.orders   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-expire products
CREATE OR REPLACE FUNCTION expire_old_products()
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET is_active = FALSE
  WHERE auto_expire_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════
-- DEMO / ADMIN SETUP
-- ═══════════════════════════════════════════
-- After running this SQL, create your admin account:
--   1. Sign up via the app (or Supabase Auth dashboard)
--   2. Then run:
--
-- UPDATE public.users SET role = 'admin', is_verified = TRUE
-- WHERE email = 'your-admin@email.com';

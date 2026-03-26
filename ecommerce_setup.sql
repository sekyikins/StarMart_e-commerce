-- ==========================================
-- E-COMMERCE ADDITIONAL TABLES
-- Run this in Supabase SQL editor to add
-- the storefront-specific tables.
-- (Products table is shared with POS system)
-- ==========================================

-- 1. STOREFRONT USERS (online shoppers)
CREATE TABLE IF NOT EXISTS public.storefront_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. DELIVERY POINTS (pickup/delivery locations)
CREATE TABLE IF NOT EXISTS public.delivery_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. ONLINE ORDERS
CREATE TABLE IF NOT EXISTS public.online_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_user_id UUID REFERENCES public.storefront_users(id) ON DELETE SET NULL,
  delivery_point_id UUID REFERENCES public.delivery_points(id) ON DELETE SET NULL,
  delivery_address TEXT,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED')),
  payment_method TEXT NOT NULL DEFAULT 'CARD'
    CHECK (payment_method IN ('CARD','MOBILE_MONEY','PAY_ON_DELIVERY')),
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. ONLINE ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.online_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.online_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. PRODUCT REVIEWS
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storefront_user_id UUID REFERENCES public.storefront_users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE public.storefront_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_storefront_users" ON public.storefront_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_delivery_points" ON public.delivery_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_online_orders" ON public.online_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_online_order_items" ON public.online_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_product_reviews" ON public.product_reviews FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_online_orders_user ON public.online_orders(storefront_user_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON public.online_orders(status);
CREATE INDEX IF NOT EXISTS idx_online_order_items_order ON public.online_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);

-- ==========================================
-- Seed: Default delivery points
-- ==========================================
INSERT INTO public.delivery_points (name, address) VALUES
  ('Main Branch Pickup', '123 Commerce Avenue, City Centre'),
  ('North Distribution Hub', '45 Industrial Road, North Side'),
  ('South Depot', '77 Southern Boulevard, South End')
ON CONFLICT DO NOTHING;

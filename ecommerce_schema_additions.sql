-- ==========================================
-- E-COMMERCE ADDITIONAL TABLES
-- ==========================================

-- 1. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_promotions" ON public.promotions FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);

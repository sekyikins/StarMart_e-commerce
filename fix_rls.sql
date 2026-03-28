-- ==========================================
-- FIX FOR E_CART RLS ERROR
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Ensure RLS is enabled on the e_cart table
ALTER TABLE public.e_cart ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "anon_e_cart_access" ON public.e_cart;

-- 3. Create a comprehensive policy for anonymous/authenticated access
-- This allows the storefront to save carts without requiring a full login 
-- (or handles it if they are logged in)
CREATE POLICY "anon_e_cart_access" ON public.e_cart
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. verify table structure matches the code expectations if needed
-- The code expects: e_customer_id (UUID or TEXT), items (JSONB), updated_at (TIMESTAMP)

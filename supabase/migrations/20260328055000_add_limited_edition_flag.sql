-- Add is_limited_edition boolean flag to products table
ALTER TABLE public.products 
ADD COLUMN is_limited_edition BOOLEAN DEFAULT FALSE;

-- Automatically mark existing Authority Sets as Limited Edition based on name
UPDATE public.products 
SET is_limited_edition = TRUE 
WHERE name ILIKE '%Authority Set%';

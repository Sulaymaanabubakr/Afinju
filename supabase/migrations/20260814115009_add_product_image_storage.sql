-- Product images are public to storefront visitors, but only staff may write
-- to the bucket. HEIC/HEIF uploads are rejected by the application before
-- they can become browser-incompatible product URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
CREATE POLICY "Staff can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND private.current_user_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "Staff can update product images" ON storage.objects;
CREATE POLICY "Staff can update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND private.current_user_role() IN ('admin', 'staff')
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND private.current_user_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "Staff can delete product images" ON storage.objects;
CREATE POLICY "Staff can delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND private.current_user_role() IN ('admin', 'staff')
  );

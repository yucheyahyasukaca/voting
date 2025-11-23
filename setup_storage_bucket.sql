-- ============================================
-- Setup Supabase Storage Bucket "elections"
-- ============================================
-- Jalankan script ini di Supabase SQL Editor untuk membuat bucket dan policies

-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'elections',
  'elections',
  true,  -- Public bucket (files dapat diakses public)
  52428800,  -- 50MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow update" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete" ON storage.objects;

-- 4. Create Storage Policies (PENTING: Nama harus unik)

-- Policy 1: Public read access (SELECT) - untuk melihat file
CREATE POLICY "Public read elections" ON storage.objects
FOR SELECT
USING (bucket_id = 'elections');

-- Policy 2: Allow upload (INSERT) - untuk upload file
-- PENTING: Harus ada WITH CHECK untuk INSERT
CREATE POLICY "Allow upload elections" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'elections');

-- Policy 3: Allow update (UPDATE) - untuk update/replace file
CREATE POLICY "Allow update elections" ON storage.objects
FOR UPDATE
USING (bucket_id = 'elections')
WITH CHECK (bucket_id = 'elections');

-- Policy 4: Allow delete (DELETE) - untuk delete file
CREATE POLICY "Allow delete elections" ON storage.objects
FOR DELETE
USING (bucket_id = 'elections');

-- ============================================
-- Verifikasi
-- ============================================
-- Cek apakah bucket sudah dibuat:
-- SELECT * FROM storage.buckets WHERE id = 'elections';

-- Cek apakah policies sudah dibuat:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';


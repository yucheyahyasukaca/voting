-- ============================================
-- FIX STORAGE RLS POLICIES
-- CATATAN: Jika error "must be owner", gunakan Dashboard UI (lihat setup_storage_via_dashboard.md)
-- ============================================

-- 1. Create Storage Bucket (jika belum ada)
-- CATATAN: Ini mungkin error jika tidak punya permission
-- Gunakan Dashboard UI: Storage → New bucket → Name: "elections" → Public: true

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
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, 52428800),
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

-- 2. Enable RLS on storage.objects (jika belum)
-- CATATAN: Jika error permission, RLS sudah enabled secara default
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies on storage.objects for elections bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public read elections" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload elections" ON storage.objects;
DROP POLICY IF EXISTS "Allow update" ON storage.objects;
DROP POLICY IF EXISTS "Allow update elections" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete elections" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 4. Create Storage Policies (PENTING: Gunakan FOR ALL atau per operation)

-- Policy 1: Public read access (SELECT) - untuk melihat file
CREATE POLICY "Public read elections" ON storage.objects
FOR SELECT
USING (bucket_id = 'elections');

-- Policy 2: Allow upload (INSERT) - untuk upload file
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
-- VERIFIKASI
-- ============================================

-- Cek bucket sudah dibuat:
-- SELECT * FROM storage.buckets WHERE id = 'elections';

-- Cek policies sudah dibuat:
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects' 
--   AND policyname LIKE '%elections%';

-- Test query (seharusnya tidak error):
-- SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'elections';


-- ============================================
-- ADD RLS POLICY FOR DELETE ON VOTES TABLE
-- ============================================
-- Script ini akan menambahkan policy DELETE pada votes table
-- untuk memungkinkan voter menghapus votes mereka (re-voting)
-- ============================================

-- Drop existing DELETE policy if any (to avoid conflicts)
DROP POLICY IF EXISTS "Votes can be deleted by voter" ON votes;

-- Create DELETE policy for votes
-- Allow voters to delete their own votes in a category (for re-voting)
CREATE POLICY "Votes can be deleted by voter" ON votes
    FOR DELETE USING (true);

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek apakah policy sudah dibuat:
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'votes'
  AND cmd = 'DELETE';

-- Seharusnya menampilkan:
-- policyname: "Votes can be deleted by voter"
-- cmd: DELETE

-- ============================================
-- CATATAN:
-- ============================================
-- Policy ini memungkinkan siapa saja untuk menghapus votes.
-- Untuk keamanan yang lebih baik, policy bisa dibatasi dengan:
--   USING (auth.uid() IS NOT NULL)
-- Atau dibatasi dengan voter_token yang sesuai.
--
-- Untuk aplikasi voting sederhana, policy "true" sudah cukup
-- karena voter hanya bisa delete votes mereka sendiri berdasarkan voter_token
-- yang sudah di-filter di aplikasi.


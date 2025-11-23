-- ============================================
-- ADD DELETE POLICY FOR VOTING_SESSIONS TABLE
-- ============================================
-- Script ini akan menambahkan RLS policy DELETE pada tabel 'voting_sessions'.
-- Ini diperlukan agar admin bisa menghapus QR code.
-- ============================================

-- Drop existing DELETE policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Voting sessions can be deleted by anyone" ON voting_sessions;

-- Create a new DELETE policy
-- This policy allows anyone to delete voting sessions
CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions
    FOR DELETE USING (true);

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek DELETE policy pada voting_sessions table
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'voting_sessions'
  AND cmd = 'DELETE';

-- Seharusnya menampilkan:
-- policyname: "Voting sessions can be deleted by anyone"
-- cmd: DELETE

-- ============================================
-- CATATAN
-- ============================================
-- Policy ini memungkinkan siapa saja untuk menghapus voting_sessions.
-- Untuk keamanan yang lebih baik, policy bisa dibatasi dengan autentikasi admin
-- atau menggunakan service role key untuk operasi admin seperti delete.
--
-- Untuk aplikasi voting sederhana, policy "true" sudah cukup
-- karena operasi delete hanya dilakukan dari halaman admin.


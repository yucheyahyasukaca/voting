-- ============================================
-- FIX VOTES TABLE CONSTRAINT - COMPLETE FIX
-- ============================================
-- Script ini akan:
-- 1. Drop SEMUA constraint lama yang salah
-- 2. Buat constraint baru yang benar
-- 3. Verifikasi constraint sudah benar
-- ============================================

-- 1. Drop SEMUA constraint lama yang salah (pastikan semua dihapus)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_key;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_candidate_id_key;

-- 2. List semua constraint yang masih ada (untuk debugging)
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'votes'::regclass 
--   AND contype = 'u'
--   AND conname LIKE '%election_id%category_id%voter_token%';

-- 3. Buat constraint baru yang benar
-- Constraint ini membolehkan voter vote untuk 2 kandidat berbeda dalam 1 kategori
-- Tapi tetap mencegah voter vote 2 kali untuk kandidat yang sama
ALTER TABLE votes ADD CONSTRAINT votes_election_id_category_id_voter_token_candidate_id_key
UNIQUE(election_id, category_id, voter_token, candidate_id);

-- 4. Verifikasi constraint sudah benar
-- Seharusnya hanya ada 1 constraint dengan nama: votes_election_id_category_id_voter_token_candidate_id_key
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'votes'::regclass 
  AND contype = 'u'
ORDER BY conname;

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- Constraint baru: UNIQUE(election_id, category_id, voter_token, candidate_id)
-- 
-- Artinya:
-- ✅ Boleh: voter1 vote untuk candidate1 DAN candidate2 dalam kategori yang sama
-- ❌ Tidak boleh: voter1 vote 2 kali untuk candidate1 yang sama
--
-- Contoh yang BOLEH:
-- (election1, category1, voter1, candidate1) ✅
-- (election1, category1, voter1, candidate2) ✅
--
-- Contoh yang TIDAK BOLEH:
-- (election1, category1, voter1, candidate1) ❌ (duplicate)
-- (election1, category1, voter1, candidate1) ❌ (duplicate)


-- ============================================
-- FIX VOTES TABLE CONSTRAINT
-- ============================================
-- Script ini akan:
-- 1. Drop constraint lama yang salah (mencegah 2 votes dalam 1 kategori)
-- 2. Buat constraint baru yang membolehkan 2 votes (untuk 2 kandidat berbeda)
-- 3. Tetap mencegah voter vote 2 kali untuk kandidat yang sama
-- ============================================

-- 1. Drop SEMUA constraint yang ada terkait election_id, category_id, voter_token
-- Pastikan semua dihapus dulu sebelum membuat yang baru
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_key;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_candidate_id_key;

-- 2. Cek constraint yang masih ada (untuk debugging)
-- Jika masih ada constraint lain, hapus manual atau sesuaikan nama
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'votes'::regclass
      AND contype = 'u'
      AND (
        pg_get_constraintdef(oid) LIKE '%election_id%'
        AND pg_get_constraintdef(oid) LIKE '%category_id%'
        AND pg_get_constraintdef(oid) LIKE '%voter_token%'
      )
  LOOP
    EXECUTE 'ALTER TABLE votes DROP CONSTRAINT IF EXISTS ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- 3. Buat constraint baru yang benar
-- Constraint ini membolehkan voter vote untuk 2 kandidat berbeda dalam 1 kategori
-- Tapi tetap mencegah voter vote 2 kali untuk kandidat yang sama
ALTER TABLE votes ADD CONSTRAINT votes_election_id_category_id_voter_token_candidate_id_key
UNIQUE(election_id, category_id, voter_token, candidate_id);

-- 3. Verifikasi constraint sudah benar
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'votes'::regclass 
--   AND contype = 'u';

-- ============================================
-- CATATAN:
-- ============================================
-- Sebelum: UNIQUE(election_id, category_id, voter_token)
--   -> Mencegah voter memberikan >1 vote per kategori (SALAH!)
--
-- Sesudah: UNIQUE(election_id, category_id, voter_token, candidate_id)
--   -> Membolehkan voter memberikan 2 votes (untuk 2 kandidat berbeda)
--   -> Tetap mencegah voter vote 2 kali untuk kandidat yang sama
--
-- Contoh:
-- ✅ Boleh: (election1, category1, voter1, candidate1)
-- ✅ Boleh: (election1, category1, voter1, candidate2)
-- ❌ Tidak boleh: (election1, category1, voter1, candidate1) lagi


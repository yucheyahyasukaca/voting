-- Script untuk memperbaiki tabel votes
-- Jalankan ini jika tabel votes sudah ada tapi strukturnya salah

-- Hapus constraint UNIQUE yang mungkin ada
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'votes_election_id_category_id_voter_token_key'
    ) THEN
        ALTER TABLE votes DROP CONSTRAINT votes_election_id_category_id_voter_token_key;
    END IF;
END $$;

-- Hapus index yang mungkin menggunakan category_id
DROP INDEX IF EXISTS idx_votes_category_id;

-- Tambah kolom category_id jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'votes' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE votes ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tambah constraint UNIQUE setelah kolom ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'votes_election_id_category_id_voter_token_key'
    ) THEN
        ALTER TABLE votes ADD CONSTRAINT votes_election_id_category_id_voter_token_key 
        UNIQUE(election_id, category_id, voter_token);
    END IF;
END $$;

-- Buat index lagi
CREATE INDEX IF NOT EXISTS idx_votes_category_id ON votes(category_id);


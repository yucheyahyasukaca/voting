-- ============================================================
-- Voting app on shared Supabase (supabase.garuda-21.com)
-- Semua objek diberi prefix vt_ supaya tidak bentrok dengan academy.
-- Tulis (insert/update/delete) hanya untuk admin yang terdaftar di vt_admins.
-- Idempotent: aman dijalankan ulang.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin allow-list (berdasarkan email JWT)
CREATE TABLE IF NOT EXISTS vt_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vt_admins ENABLE ROW LEVEL SECURITY;  -- tanpa policy: tidak bisa diakses via API

CREATE OR REPLACE FUNCTION vt_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM vt_admins
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
REVOKE ALL ON FUNCTION vt_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vt_is_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION vt_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS vt_elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  hero_banner_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  allow_view_results BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vt_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES vt_elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vt_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES vt_elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint akhir: satu voter boleh memilih beberapa kandidat berbeda dalam satu kategori
CREATE TABLE IF NOT EXISTS vt_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES vt_elections(id) ON DELETE CASCADE,
  category_id UUID REFERENCES vt_categories(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES vt_candidates(id) ON DELETE CASCADE,
  voter_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vt_votes_unique_per_candidate
    UNIQUE (election_id, category_id, voter_token, candidate_id)
);

CREATE TABLE IF NOT EXISTS vt_voting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES vt_elections(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vt_votes_election_id ON vt_votes(election_id);
CREATE INDEX IF NOT EXISTS idx_vt_votes_candidate_id ON vt_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_vt_votes_voter_token ON vt_votes(voter_token);
CREATE INDEX IF NOT EXISTS idx_vt_votes_category_id ON vt_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_vt_candidates_election_id ON vt_candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_vt_categories_election_id ON vt_categories(election_id);
CREATE INDEX IF NOT EXISTS idx_vt_voting_sessions_election_id ON vt_voting_sessions(election_id);

DROP TRIGGER IF EXISTS vt_elections_updated_at ON vt_elections;
CREATE TRIGGER vt_elections_updated_at BEFORE UPDATE ON vt_elections
  FOR EACH ROW EXECUTE FUNCTION vt_set_updated_at();
DROP TRIGGER IF EXISTS vt_candidates_updated_at ON vt_candidates;
CREATE TRIGGER vt_candidates_updated_at BEFORE UPDATE ON vt_candidates
  FOR EACH ROW EXECUTE FUNCTION vt_set_updated_at();
DROP TRIGGER IF EXISTS vt_categories_updated_at ON vt_categories;
CREATE TRIGGER vt_categories_updated_at BEFORE UPDATE ON vt_categories
  FOR EACH ROW EXECUTE FUNCTION vt_set_updated_at();

-- ---------------- RLS ----------------
ALTER TABLE vt_elections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vt_candidates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vt_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vt_votes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vt_voting_sessions  ENABLE ROW LEVEL SECURITY;

-- Baca: publik (voter perlu membaca pemilihan, kandidat, sesi QR, dan hasil)
DROP POLICY IF EXISTS vt_elections_read ON vt_elections;
CREATE POLICY vt_elections_read ON vt_elections FOR SELECT USING (true);
DROP POLICY IF EXISTS vt_candidates_read ON vt_candidates;
CREATE POLICY vt_candidates_read ON vt_candidates FOR SELECT USING (true);
DROP POLICY IF EXISTS vt_categories_read ON vt_categories;
CREATE POLICY vt_categories_read ON vt_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS vt_votes_read ON vt_votes;
CREATE POLICY vt_votes_read ON vt_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS vt_sessions_read ON vt_voting_sessions;
CREATE POLICY vt_sessions_read ON vt_voting_sessions FOR SELECT USING (true);

-- Tulis: hanya admin terdaftar
DROP POLICY IF EXISTS vt_elections_admin ON vt_elections;
CREATE POLICY vt_elections_admin ON vt_elections FOR ALL
  USING (vt_is_admin()) WITH CHECK (vt_is_admin());
DROP POLICY IF EXISTS vt_candidates_admin ON vt_candidates;
CREATE POLICY vt_candidates_admin ON vt_candidates FOR ALL
  USING (vt_is_admin()) WITH CHECK (vt_is_admin());
DROP POLICY IF EXISTS vt_categories_admin ON vt_categories;
CREATE POLICY vt_categories_admin ON vt_categories FOR ALL
  USING (vt_is_admin()) WITH CHECK (vt_is_admin());
DROP POLICY IF EXISTS vt_sessions_admin ON vt_voting_sessions;
CREATE POLICY vt_sessions_admin ON vt_voting_sessions FOR ALL
  USING (vt_is_admin()) WITH CHECK (vt_is_admin());

-- Votes: voter (anon) boleh insert hanya dengan token QR aktif milik pemilihan yang sama;
-- hapus hanya admin (reset hasil).
DROP POLICY IF EXISTS vt_votes_insert ON vt_votes;
CREATE POLICY vt_votes_insert ON vt_votes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM vt_voting_sessions s
    WHERE s.qr_code = voter_token
      AND s.election_id = vt_votes.election_id
      AND s.is_active
      AND (s.expires_at IS NULL OR s.expires_at > NOW())
  )
);
DROP POLICY IF EXISTS vt_votes_delete ON vt_votes;
CREATE POLICY vt_votes_delete ON vt_votes FOR DELETE USING (vt_is_admin());

-- ---------------- Storage: bucket baru, bucket academy tidak disentuh ----------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('vt-elections', 'vt-elections', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS vt_elections_objects_read ON storage.objects;
CREATE POLICY vt_elections_objects_read ON storage.objects FOR SELECT
  USING (bucket_id = 'vt-elections');
DROP POLICY IF EXISTS vt_elections_objects_admin ON storage.objects;
CREATE POLICY vt_elections_objects_admin ON storage.objects FOR ALL
  USING (bucket_id = 'vt-elections' AND vt_is_admin())
  WITH CHECK (bucket_id = 'vt-elections' AND vt_is_admin());

-- Admin pertama
INSERT INTO vt_admins (email) VALUES ('vote@garuda-21.com') ON CONFLICT DO NOTHING;

COMMIT;

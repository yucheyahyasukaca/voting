-- ============================================
-- COMPREHENSIVE FIX SCRIPT
-- Script ini akan memperbaiki semua masalah yang mungkin menyebabkan error
-- ============================================

-- ============================================
-- 1. VERIFY & FIX EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. VERIFY & FIX ALL TABLES
-- ============================================

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
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

-- Tambah kolom jika belum ada
ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS allow_view_results BOOLEAN DEFAULT false;

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table - DROP & RECREATE untuk memastikan struktur benar
DROP TABLE IF EXISTS votes CASCADE;

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  voter_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_id, category_id, voter_token)
);

-- Voting sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'voter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_votes_election_id ON votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_token ON votes(voter_token);
CREATE INDEX IF NOT EXISTS idx_votes_category_id ON votes(category_id);
CREATE INDEX IF NOT EXISTS idx_candidates_election_id ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_categories_election_id ON categories(election_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_qr_code ON voting_sessions(qr_code);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_election_id ON voting_sessions(election_id);

-- ============================================
-- 4. CREATE FUNCTIONS & TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_elections_updated_at ON elections;
CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. DROP ALL EXISTING POLICIES
-- ============================================

-- Elections
DROP POLICY IF EXISTS "Elections are viewable by everyone" ON elections;
DROP POLICY IF EXISTS "Elections can be inserted by anyone" ON elections;
DROP POLICY IF EXISTS "Elections can be updated by anyone" ON elections;

-- Candidates
DROP POLICY IF EXISTS "Candidates are viewable by everyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be inserted by anyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be updated by anyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be deleted by anyone" ON candidates;

-- Categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories can be inserted by anyone" ON categories;
DROP POLICY IF EXISTS "Categories can be updated by anyone" ON categories;
DROP POLICY IF EXISTS "Categories can be deleted by anyone" ON categories;

-- Votes (PENTING: Pastikan ada policies untuk SELECT)
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON votes;
DROP POLICY IF EXISTS "Votes can be inserted by anyone" ON votes;

-- Voting sessions
DROP POLICY IF EXISTS "Voting sessions are viewable by everyone" ON voting_sessions;
DROP POLICY IF EXISTS "Voting sessions can be inserted by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Voting sessions can be updated by anyone" ON voting_sessions;

-- Users
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can be inserted by anyone" ON users;
DROP POLICY IF EXISTS "Users can be updated by anyone" ON users;

-- ============================================
-- 7. CREATE RLS POLICIES (BARU)
-- ============================================

-- Elections: Public read and write
CREATE POLICY "Elections are viewable by everyone" ON elections
    FOR SELECT USING (true);

CREATE POLICY "Elections can be inserted by anyone" ON elections
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Elections can be updated by anyone" ON elections
    FOR UPDATE USING (true);

-- Candidates: Public read and write
CREATE POLICY "Candidates are viewable by everyone" ON candidates
    FOR SELECT USING (true);

CREATE POLICY "Candidates can be inserted by anyone" ON candidates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Candidates can be updated by anyone" ON candidates
    FOR UPDATE USING (true);

CREATE POLICY "Candidates can be deleted by anyone" ON candidates
    FOR DELETE USING (true);

-- Categories: Public read and write
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories can be inserted by anyone" ON categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Categories can be updated by anyone" ON categories
    FOR UPDATE USING (true);

CREATE POLICY "Categories can be deleted by anyone" ON categories
    FOR DELETE USING (true);

-- Votes: Public read and insert (PENTING UNTUK FIX ERROR 406!)
CREATE POLICY "Votes are viewable by everyone" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Votes can be inserted by anyone" ON votes
    FOR INSERT WITH CHECK (true);

-- Voting sessions: Public read and write
CREATE POLICY "Voting sessions are viewable by everyone" ON voting_sessions
    FOR SELECT USING (true);

CREATE POLICY "Voting sessions can be inserted by anyone" ON voting_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Voting sessions can be updated by anyone" ON voting_sessions
    FOR UPDATE USING (true);

-- Users: Public read and write
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can be inserted by anyone" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated by anyone" ON users
    FOR UPDATE USING (true);

-- ============================================
-- 8. VERIFICATION QUERIES (Optional - uncomment untuk test)
-- ============================================
-- Test SELECT query untuk votes (seharusnya tidak error)
-- SELECT COUNT(*) FROM votes;

-- Test SELECT query untuk elections (seharusnya tidak error)
-- SELECT COUNT(*) FROM elections;

-- Cek apakah semua policies aktif
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;


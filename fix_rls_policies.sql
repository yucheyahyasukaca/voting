-- Script untuk memperbaiki RLS Policies
-- Jalankan ini jika ada masalah dengan UPDATE/INSERT/SELECT operations

-- Enable RLS on all tables (jika belum)
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (untuk recreate)
-- ============================================

-- Elections policies
DROP POLICY IF EXISTS "Elections are viewable by everyone" ON elections;
DROP POLICY IF EXISTS "Elections can be inserted by anyone" ON elections;
DROP POLICY IF EXISTS "Elections can be updated by anyone" ON elections;

-- Candidates policies
DROP POLICY IF EXISTS "Candidates are viewable by everyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be inserted by anyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be updated by anyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be deleted by anyone" ON candidates;

-- Categories policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories can be inserted by anyone" ON categories;
DROP POLICY IF EXISTS "Categories can be updated by anyone" ON categories;
DROP POLICY IF EXISTS "Categories can be deleted by anyone" ON categories;

-- Votes policies
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON votes;
DROP POLICY IF EXISTS "Votes can be inserted by anyone" ON votes;

-- Voting sessions policies
DROP POLICY IF EXISTS "Voting sessions are viewable by everyone" ON voting_sessions;
DROP POLICY IF EXISTS "Voting sessions can be inserted by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Voting sessions can be updated by anyone" ON voting_sessions;

-- Users policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can be inserted by anyone" ON users;
DROP POLICY IF EXISTS "Users can be updated by anyone" ON users;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

-- Elections: Public read and write access
CREATE POLICY "Elections are viewable by everyone" ON elections
    FOR SELECT USING (true);

CREATE POLICY "Elections can be inserted by anyone" ON elections
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Elections can be updated by anyone" ON elections
    FOR UPDATE USING (true);

-- Candidates: Public read and write access
CREATE POLICY "Candidates are viewable by everyone" ON candidates
    FOR SELECT USING (true);

CREATE POLICY "Candidates can be inserted by anyone" ON candidates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Candidates can be updated by anyone" ON candidates
    FOR UPDATE USING (true);

CREATE POLICY "Candidates can be deleted by anyone" ON candidates
    FOR DELETE USING (true);

-- Categories: Public read and write access
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories can be inserted by anyone" ON categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Categories can be updated by anyone" ON categories
    FOR UPDATE USING (true);

CREATE POLICY "Categories can be deleted by anyone" ON categories
    FOR DELETE USING (true);

-- Votes: Public read and insert
CREATE POLICY "Votes are viewable by everyone" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Votes can be inserted by anyone" ON votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Votes can be deleted by voter" ON votes
    FOR DELETE USING (true);

-- Voting sessions: Public read and write access
CREATE POLICY "Voting sessions are viewable by everyone" ON voting_sessions
    FOR SELECT USING (true);

CREATE POLICY "Voting sessions can be inserted by anyone" ON voting_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Voting sessions can be updated by anyone" ON voting_sessions
    FOR UPDATE USING (true);

-- Users: Public read and write access
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can be inserted by anyone" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated by anyone" ON users
    FOR UPDATE USING (true);

-- ============================================
-- Verifikasi kolom allow_view_results
-- ============================================

-- Tambah kolom jika belum ada
ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS allow_view_results BOOLEAN DEFAULT false;

-- Set default untuk baris yang sudah ada tapi NULL
UPDATE elections 
SET allow_view_results = false 
WHERE allow_view_results IS NULL;


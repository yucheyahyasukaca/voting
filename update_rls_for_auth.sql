-- Update RLS policies untuk menggunakan authenticated users
-- Ini membuat admin routes hanya bisa diakses oleh user yang login

-- ============================================
-- ELECTIONS POLICIES (Update untuk authenticated only)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Elections can be inserted by anyone" ON elections;
DROP POLICY IF EXISTS "Elections can be updated by anyone" ON elections;
DROP POLICY IF EXISTS "Elections can be deleted by anyone" ON elections;

-- Create new policies for authenticated users only
CREATE POLICY "Elections can be inserted by authenticated users" ON elections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Elections can be updated by authenticated users" ON elections
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Elections can be deleted by authenticated users" ON elections
    FOR DELETE USING (auth.role() = 'authenticated');

-- Keep SELECT public (voters need to see elections)
-- Already exists: "Elections are viewable by everyone"

-- ============================================
-- CANDIDATES POLICIES (Update untuk authenticated only)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Candidates can be inserted by anyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be updated by anyone" ON candidates;
DROP POLICY IF EXISTS "Candidates can be deleted by anyone" ON candidates;

-- Create new policies for authenticated users only
CREATE POLICY "Candidates can be inserted by authenticated users" ON candidates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Candidates can be updated by authenticated users" ON candidates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Candidates can be deleted by authenticated users" ON candidates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Keep SELECT public (voters need to see candidates)
-- Already exists: "Candidates are viewable by everyone"

-- ============================================
-- CATEGORIES POLICIES (Update untuk authenticated only)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Categories can be inserted by anyone" ON categories;
DROP POLICY IF EXISTS "Categories can be updated by anyone" ON categories;
DROP POLICY IF EXISTS "Categories can be deleted by anyone" ON categories;

-- Create new policies for authenticated users only
CREATE POLICY "Categories can be inserted by authenticated users" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories can be updated by authenticated users" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Categories can be deleted by authenticated users" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Keep SELECT public (voters need to see categories)
-- Already exists: "Categories are viewable by everyone"

-- ============================================
-- VOTING SESSIONS POLICIES (Update untuk authenticated only)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Voting sessions can be inserted by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Voting sessions can be updated by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Voting sessions can be deleted by anyone" ON voting_sessions;

-- Create new policies for authenticated users only
CREATE POLICY "Voting sessions can be inserted by authenticated users" ON voting_sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Voting sessions can be updated by authenticated users" ON voting_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Voting sessions can be deleted by authenticated users" ON voting_sessions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Keep SELECT public (voters need to validate QR codes)
-- Already exists: "Voting sessions are viewable by everyone"

-- ============================================
-- VOTES POLICIES (Keep INSERT public untuk voting)
-- ============================================

-- Votes INSERT tetap public (untuk voters)
-- Already exists: "Votes can be inserted by anyone"

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Votes can be deleted by anyone" ON votes;

-- Create new DELETE policy for authenticated users only
CREATE POLICY "Votes can be deleted by authenticated users" ON votes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Keep SELECT public (untuk results page)
-- Already exists: "Votes are viewable by everyone"

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Public (Voters):
--    - SELECT: elections, candidates, categories, voting_sessions, votes
--    - INSERT: votes (untuk voting)
-- 
-- ✅ Authenticated Only (Admin):
--    - INSERT/UPDATE/DELETE: elections, candidates, categories, voting_sessions
--    - DELETE: votes
--
-- This ensures only logged-in admins can manage data,
-- while voters can still view and vote without authentication.


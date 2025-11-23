-- Add DELETE policies for elections and voting_sessions
-- This allows deletion of elections and voting_sessions with cascade
-- Using DROP IF EXISTS to avoid conflicts with existing policies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Elections can be deleted by anyone" ON elections;
DROP POLICY IF EXISTS "Voting sessions can be deleted by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Votes can be deleted by anyone" ON votes;

-- Create DELETE policies
CREATE POLICY "Elections can be deleted by anyone" ON elections
    FOR DELETE USING (true);

CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions
    FOR DELETE USING (true);

CREATE POLICY "Votes can be deleted by anyone" ON votes
    FOR DELETE USING (true);

-- Note: Dalam produksi, sebaiknya batasi DELETE hanya untuk admin yang terautentikasi
-- Contoh: FOR DELETE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');


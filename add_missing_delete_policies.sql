-- Query alternatif jika ada error policy sudah ada
-- Hanya menambahkan policy yang masih kurang

-- Cek dan tambahkan policy untuk Elections
DROP POLICY IF EXISTS "Elections can be deleted by anyone" ON elections;
CREATE POLICY "Elections can be deleted by anyone" ON elections
    FOR DELETE USING (true);

-- Cek dan tambahkan policy untuk Votes
DROP POLICY IF EXISTS "Votes can be deleted by anyone" ON votes;
CREATE POLICY "Votes can be deleted by anyone" ON votes
    FOR DELETE USING (true);

-- Note: Voting sessions delete policy sudah ada, skip
-- Jika ingin update, uncomment baris berikut:
-- DROP POLICY IF EXISTS "Voting sessions can be deleted by anyone" ON voting_sessions;
-- CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions
--     FOR DELETE USING (true);


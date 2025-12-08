-- CLEANUP AND APPLY CONSTRAINT
-- This script will:
-- 1. Remove duplicate votes (keeping only one per voter per category) to resolve key violations.
-- 2. Apply the strict unique constraint.

-- 1. Remove duplicate votes
-- Keeps the one with the 'latest' or 'max' ID (arbitrary but ensures only 1 remains)
DELETE FROM votes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY election_id, category_id, voter_token ORDER BY id DESC) as rnum
    FROM votes
  ) t
  WHERE t.rnum > 1
);

-- 2. Drop existing constraints (just in case)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_candidate_id_key;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_key;

-- 3. Add the strict constraint
ALTER TABLE votes ADD CONSTRAINT votes_election_id_category_id_voter_token_key 
UNIQUE(election_id, category_id, voter_token);

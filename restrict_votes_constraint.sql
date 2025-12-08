-- NEW CONSTRAINT: Restrict to 1 vote per voter per category
-- This replaces the old constraint that allowed multiple candidates per category (votes_election_id_category_id_voter_token_candidate_id_key)

-- 1. Drop existing constraints (both old and potentially intermediate ones)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_candidate_id_key;
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_key;

-- 2. Add the strict constraint
-- This ensures a voter (identified by voter_token) can only have ONE entry per category in an election.
-- Attempting to insert a second vote for a different candidate will fail.
ALTER TABLE votes ADD CONSTRAINT votes_election_id_category_id_voter_token_key 
UNIQUE(election_id, category_id, voter_token);

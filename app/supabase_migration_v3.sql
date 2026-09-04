-- Migration v3: Prepared Leaderboard & Recent Scores Views with Deterministic Ties and Performance Indexes

-- 1. Create composite index to optimize window partition and ordering for leaderboard calculation
-- LOWER(TRIM(player_name)) supports case-insensitive trimming/grouping.
-- (score DESC, created_at ASC, id ASC) ensures fast extraction of the best score and deterministic tie-breaker.
CREATE INDEX IF NOT EXISTS idx_rush_scores_leaderboard_partition 
ON rush_scores (LOWER(TRIM(player_name)), score DESC, created_at ASC, id ASC);

-- 2. Create prepared leaderboard view for the last 30 days
-- Selects only the single best score per unique player (case-insensitive deduplication)
-- Handles ties deterministically:
--   a) Highest score first
--   b) Earliest created_at if scores are equal
--   c) ID ascending if still tied
CREATE OR REPLACE VIEW rush_leaderboard_30d AS
WITH ranked_scores AS (
  SELECT 
    id,
    player_name,
    store_name,
    score,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(player_name))
      ORDER BY score DESC, created_at ASC, id ASC
    ) as rn
  FROM rush_scores
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  id,
  player_name,
  store_name,
  score,
  created_at
FROM ranked_scores
WHERE rn = 1;

-- 3. Create prepared recent scores view for the last 30 days
-- Simply lists recent scores from the last 30 days sorted by newest first
CREATE OR REPLACE VIEW rush_recent_scores_30d AS
SELECT 
  id,
  player_name,
  store_name,
  score,
  created_at
FROM rush_scores
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 4. Set explicit public SELECT permissions on views for anon and authenticated users
GRANT SELECT ON TABLE rush_leaderboard_30d TO anon, authenticated;
GRANT SELECT ON TABLE rush_recent_scores_30d TO anon, authenticated;

-- Document that direct INSERT/UPDATE/DELETE operations remain strictly blocked on the base table 'rush_scores',
-- and scores must be submitted safely via the existing 'submit_rush_score' RPC function.

-- Update rush_scores to add submission_id with unique constraint
ALTER TABLE rush_scores ADD COLUMN IF NOT EXISTS submission_id UUID UNIQUE;

-- Add check constraints with NOT VALID to preserve legacy records without breaking migration
ALTER TABLE rush_scores ADD CONSTRAINT chk_player_name_len CHECK (length(trim(player_name)) BETWEEN 2 AND 50) NOT VALID;
ALTER TABLE rush_scores ADD CONSTRAINT chk_store_name_len CHECK (length(trim(store_name)) BETWEEN 2 AND 80) NOT VALID;
ALTER TABLE rush_scores ADD CONSTRAINT chk_score_non_negative CHECK (score >= 0) NOT VALID;
ALTER TABLE rush_scores ADD CONSTRAINT chk_score_max_limit CHECK (score <= 1000) NOT VALID;

-- Create indexes to optimize current leaderboard queries
CREATE INDEX IF NOT EXISTS idx_rush_scores_score_created ON rush_scores (score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rush_scores_created_at ON rush_scores (created_at DESC);

-- Drop direct anonymous INSERT permission (remove policy)
DROP POLICY IF EXISTS "Allow public insert access" ON rush_scores;

-- Create controlled RPC function for secure score submissions
CREATE OR REPLACE FUNCTION submit_rush_score(
  p_player_name TEXT,
  p_store_name TEXT,
  p_score INTEGER,
  p_submission_id UUID
)
RETURNS rush_scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed_player TEXT;
  v_trimmed_store TEXT;
  v_collapsed_player TEXT;
  v_collapsed_store TEXT;
  v_inserted_row rush_scores;
BEGIN
  -- 1. Inputs must not be null
  IF p_player_name IS NULL THEN
    RAISE EXCEPTION 'Player name cannot be null.';
  END IF;
  IF p_store_name IS NULL THEN
    RAISE EXCEPTION 'Store name cannot be null.';
  END IF;
  IF p_score IS NULL THEN
    RAISE EXCEPTION 'Score cannot be null.';
  END IF;
  IF p_submission_id IS NULL THEN
    RAISE EXCEPTION 'Submission ID cannot be null.';
  END IF;

  -- 2. Trim inputs
  v_trimmed_player := trim(p_player_name);
  v_trimmed_store := trim(p_store_name);
  
  -- Collapse repeated internal spaces (e.g. 'John   Doe' -> 'John Doe')
  v_collapsed_player := regexp_replace(v_trimmed_player, '\s+', ' ', 'g');
  v_collapsed_store := regexp_replace(v_trimmed_store, '\s+', ' ', 'g');
  
  -- 3. Length & Range validations
  IF length(v_collapsed_player) < 2 OR length(v_collapsed_player) > 50 THEN
    RAISE EXCEPTION 'Player name must be between 2 and 50 characters.';
  END IF;
  
  IF length(v_collapsed_store) < 2 OR length(v_collapsed_store) > 80 THEN
    RAISE EXCEPTION 'Store name must be between 2 and 80 characters.';
  END IF;
  
  -- Validate score bounds (Max limit is 1000 points based on human play speed and 20s recipe timer)
  IF p_score < 0 OR p_score > 1000 THEN
    RAISE EXCEPTION 'Score must be between 0 and 1000 points.';
  END IF;

  -- 4. Secure insert using security definer context
  INSERT INTO rush_scores (
    player_name,
    store_name,
    score,
    submission_id
  )
  VALUES (
    v_collapsed_player,
    v_collapsed_store,
    p_score,
    p_submission_id
  )
  RETURNING * INTO v_inserted_row;
  
  RETURN v_inserted_row;
END;
$$;

-- Grant EXECUTE permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION submit_rush_score TO anon, authenticated;

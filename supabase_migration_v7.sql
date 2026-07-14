-- Migration v7: Secure Live Ranking, Round Results & Tournament Leaderboard Snapshots
-- This migration implements server-authoritative, deterministic rankings using Postgres window functions
-- and secures reading round/tournament leaderboards through strict reconnection token validation.

-- 1. Round Leaderboard RPC
CREATE OR REPLACE FUNCTION get_arena_round_leaderboard(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  rank INTEGER,
  display_name TEXT,
  store_name TEXT,
  avatar_asset_key TEXT,
  round_score INTEGER,
  is_current_participant BOOLEAN,
  is_late_joiner BOOLEAN,
  participant_status TEXT,
  is_active BOOLEAN,
  round_number INTEGER,
  game_type TEXT,
  round_status TEXT,
  server_generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_caller_id UUID;
  v_round_id UUID;
  v_round_number INTEGER;
  v_game_type TEXT;
  v_round_status TEXT;
BEGIN
  -- Validate caller and room
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id INTO v_caller_id, v_room_id
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code))
    AND r.status != 'closed';

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- Get active or latest round
  SELECT r.id, r.round_number, r.game_type, r.status INTO v_round_id, v_round_number, v_game_type, v_round_status
  FROM arena_rounds r
  WHERE r.room_id = v_room_id
  ORDER BY CASE WHEN r.status = 'active' THEN 0 ELSE 1 END, r.round_number DESC
  LIMIT 1;

  IF v_round_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    (row_number() OVER (
      ORDER BY 
        rp.round_score DESC, 
        rp.joined_at ASC, 
        p.id ASC
    ))::integer as rank,
    p.display_name,
    p.store_name,
    a.asset_key as avatar_asset_key,
    rp.round_score,
    (p.id = v_caller_id) as is_current_participant,
    rp.joined_late as is_late_joiner,
    rp.status as participant_status,
    p.is_active,
    v_round_number as round_number,
    v_game_type as game_type,
    v_round_status as round_status,
    NOW() as server_generated_at
  FROM arena_round_participants rp
  JOIN arena_participants p ON rp.participant_id = p.id
  JOIN arena_avatars a ON p.avatar_id = a.id
  WHERE rp.round_id = v_round_id;
END;
$$;


-- 2. Tournament Leaderboard RPC
CREATE OR REPLACE FUNCTION get_arena_tournament_leaderboard(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  rank INTEGER,
  display_name TEXT,
  store_name TEXT,
  avatar_asset_key TEXT,
  total_score INTEGER,
  is_current_participant BOOLEAN,
  is_late_joiner BOOLEAN,
  participant_status TEXT,
  is_active BOOLEAN,
  room_status TEXT,
  current_round_number INTEGER,
  server_generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_caller_id UUID;
  v_room_status TEXT;
  v_current_round INTEGER;
BEGIN
  -- Validate caller and room
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status, r.current_round_number INTO v_caller_id, v_room_id, v_room_status, v_current_round
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code))
    AND r.status != 'closed';

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  RETURN QUERY
  SELECT 
    (row_number() OVER (
      ORDER BY 
        p.total_score DESC, 
        p.joined_at ASC, 
        p.id ASC
    ))::integer as rank,
    p.display_name,
    p.store_name,
    a.asset_key as avatar_asset_key,
    p.total_score,
    (p.id = v_caller_id) as is_current_participant,
    p.is_late_joiner,
    p.status as participant_status,
    p.is_active,
    v_room_status as room_status,
    v_current_round as current_round_number,
    NOW() as server_generated_at
  FROM arena_participants p
  JOIN arena_avatars a ON p.avatar_id = a.id
  WHERE p.room_id = v_room_id;
END;
$$;


-- 3. Participant Rank Summary RPC
CREATE OR REPLACE FUNCTION get_arena_participant_rank_summary(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  round_rank INTEGER,
  round_score INTEGER,
  tournament_rank INTEGER,
  tournament_score INTEGER,
  total_participant_count INTEGER,
  is_late_joiner BOOLEAN,
  server_generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_caller_id UUID;
  v_round_id UUID;
  v_round_score INTEGER := 0;
  v_round_rank INTEGER := 1;
  v_tourney_score INTEGER := 0;
  v_tourney_rank INTEGER := 1;
  v_total_count INTEGER := 0;
  v_is_late BOOLEAN := false;
BEGIN
  -- Validate caller and room
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, p.total_score, p.is_late_joiner INTO v_caller_id, v_room_id, v_tourney_score, v_is_late
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code))
    AND r.status != 'closed';

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- Total count of active participants
  SELECT COUNT(*)::integer INTO v_total_count
  FROM arena_participants
  WHERE room_id = v_room_id AND is_active = true;

  -- Calculate tournament rank
  SELECT r_rank.computed_rank INTO v_tourney_rank
  FROM (
    SELECT 
      id, 
      (row_number() OVER (ORDER BY total_score DESC, joined_at ASC, id ASC))::integer as computed_rank
    FROM arena_participants
    WHERE room_id = v_room_id
  ) r_rank
  WHERE r_rank.id = v_caller_id;

  -- Get latest round
  SELECT r.id INTO v_round_id
  FROM arena_rounds r
  WHERE r.room_id = v_room_id
  ORDER BY r.round_number DESC
  LIMIT 1;

  IF v_round_id IS NOT NULL THEN
    -- Calculate round score and rank
    SELECT rp.round_score, r_rank.computed_rank INTO v_round_score, v_round_rank
    FROM arena_round_participants rp
    JOIN (
      SELECT 
        id, 
        (row_number() OVER (ORDER BY round_score DESC, joined_at ASC, participant_id ASC))::integer as computed_rank
      FROM arena_round_participants
      WHERE round_id = v_round_id
    ) r_rank ON rp.id = r_rank.id
    WHERE rp.participant_id = v_caller_id AND rp.round_id = v_round_id;
  END IF;

  RETURN QUERY SELECT
    COALESCE(v_round_rank, 1) as round_rank,
    COALESCE(v_round_score, 0) as round_score,
    COALESCE(v_tourney_rank, 1) as tournament_rank,
    COALESCE(v_tourney_score, 0) as tournament_score,
    v_total_count as total_participant_count,
    v_is_late as is_late_joiner,
    NOW() as server_generated_at;
END;
$$;


-- 4. Round Results RPC
CREATE OR REPLACE FUNCTION get_arena_round_results(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  round_number INTEGER,
  game_type TEXT,
  round_status TEXT,
  round_ended_at TIMESTAMPTZ,
  current_participant_round_score INTEGER,
  current_participant_round_rank INTEGER,
  total_participant_count INTEGER,
  has_next_round BOOLEAN,
  next_round_game_type TEXT,
  server_generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_caller_id UUID;
  v_round_id UUID;
  v_round_number INTEGER;
  v_game_type TEXT;
  v_round_status TEXT;
  v_round_ended_at TIMESTAMPTZ;
  v_caller_score INTEGER := 0;
  v_caller_rank INTEGER := 1;
  v_total_count INTEGER := 0;
  v_has_next BOOLEAN := false;
  v_next_game TEXT := NULL;
BEGIN
  -- Validate caller and room
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id INTO v_caller_id, v_room_id
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code))
    AND r.status != 'closed';

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- Get latest round (active or completed)
  SELECT r.id, r.round_number, r.game_type, r.status, r.completed_at INTO v_round_id, v_round_number, v_game_type, v_round_status, v_round_ended_at
  FROM arena_rounds r
  WHERE r.room_id = v_room_id
  ORDER BY r.round_number DESC
  LIMIT 1;

  IF v_round_id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate total participants in this round
  SELECT COUNT(*)::integer INTO v_total_count
  FROM arena_round_participants
  WHERE round_id = v_round_id;

  -- Calculate caller rank and score
  SELECT rp.round_score, r_rank.computed_rank INTO v_caller_score, v_caller_rank
  FROM arena_round_participants rp
  JOIN (
    SELECT 
      id, 
      (row_number() OVER (ORDER BY round_score DESC, joined_at ASC, participant_id ASC))::integer as computed_rank
    FROM arena_round_participants
    WHERE round_id = v_round_id
  ) r_rank ON rp.id = r_rank.id
  WHERE rp.participant_id = v_caller_id AND rp.round_id = v_round_id;

  -- Check if next round exists
  IF v_round_number = 1 THEN
    v_has_next := true;
    v_next_game := 'quick_think';
  END IF;

  RETURN QUERY SELECT
    v_round_number as round_number,
    v_game_type as game_type,
    v_round_status as round_status,
    v_round_ended_at as round_ended_at,
    COALESCE(v_caller_score, 0) as current_participant_round_score,
    COALESCE(v_caller_rank, 1) as current_participant_round_rank,
    v_total_count as total_participant_count,
    v_has_next as has_next_round,
    v_next_game as next_round_game_type,
    NOW() as server_generated_at;
END;
$$;


-- 5. Tournament Results RPC
CREATE OR REPLACE FUNCTION get_arena_tournament_results(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  tournament_complete BOOLEAN,
  current_participant_rank INTEGER,
  current_participant_total_score INTEGER,
  total_participant_count INTEGER,
  room_status TEXT,
  server_generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_caller_id UUID;
  v_room_status TEXT;
  v_caller_score INTEGER := 0;
  v_caller_rank INTEGER := 1;
  v_total_count INTEGER := 0;
BEGIN
  -- Validate caller and room
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status INTO v_caller_id, v_room_id, v_room_status
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code))
    AND r.status != 'closed';

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- Total count of participants in the room
  SELECT COUNT(*)::integer INTO v_total_count
  FROM arena_participants
  WHERE room_id = v_room_id AND is_active = true;

  -- Calculate caller rank and score
  SELECT p.total_score, r_rank.computed_rank INTO v_caller_score, v_caller_rank
  FROM arena_participants p
  JOIN (
    SELECT 
      id, 
      (row_number() OVER (ORDER BY total_score DESC, joined_at ASC, id ASC))::integer as computed_rank
    FROM arena_participants
    WHERE room_id = v_room_id
  ) r_rank ON p.id = r_rank.id
  WHERE p.id = v_caller_id;

  RETURN QUERY SELECT
    (v_room_status = 'results') as tournament_complete,
    COALESCE(v_caller_rank, 1) as current_participant_rank,
    COALESCE(v_caller_score, 0) as current_participant_total_score,
    v_total_count as total_participant_count,
    v_room_status as room_status,
    NOW() as server_generated_at;
END;
$$;


-- 6. Grant execute access on new RPCs to public
GRANT EXECUTE ON FUNCTION get_arena_round_leaderboard(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_arena_tournament_leaderboard(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_arena_participant_rank_summary(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_arena_round_results(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_arena_tournament_results(TEXT, TEXT) TO anon, authenticated;

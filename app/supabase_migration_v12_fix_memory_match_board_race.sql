-- ============================================================================
-- MIGRATION V12: Fix Race Condition in Memory Match Board Generation
-- Poke House Arena — Apply in Supabase SQL Editor
--
-- CAUSE OF ERROR (PostgreSQL 23505 / HTTP 409 uq_arena_mm_board):
-- Previous implementation suffered from a TOCTOU race condition: concurrent
-- requests (e.g. React StrictMode or multiple players joining simultaneously)
-- executed SELECT simultaneously, found no existing board, and both attempted
-- INSERT INTO arena_memory_match_boards, violating the unique constraint.
--
-- SOLUTIONS IMPLEMENTED:
-- 1. Serializes board initialization per (round_id, participant_id) using
--    pg_advisory_xact_lock(hashtextextended(v_round_id || ':' || v_participant_id, 0)).
-- 2. Uses atomic INSERT ... ON CONFLICT ON CONSTRAINT uq_arena_mm_board DO NOTHING.
-- 3. Only the transaction that successfully created the board (v_board_was_created = true)
--    generates and inserts the cards.
-- 4. Validates that exactly v_pair_count * 2 cards exist; otherwise raises P0001.
-- 5. Preserves 20 cards (10 pairs) matching the active game layout.
-- 6. Preserves SECURITY DEFINER, search_path = public, extensions, pg_temp, and EXECUTE grants.
-- ============================================================================

-- 1. Create or Replace authoritative get_memory_match_round_state
CREATE OR REPLACE FUNCTION public.get_memory_match_round_state(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  card_id UUID,
  position INTEGER,
  card_side TEXT,
  status TEXT,
  label_pt TEXT,
  label_en TEXT,
  round_score INTEGER,
  total_score INTEGER,
  remaining_round_seconds INTEGER,
  board_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_room_status TEXT;
  v_participant_id UUID;
  v_round_id UUID;
  v_ends_at TIMESTAMPTZ;
  v_game_type TEXT;
  
  -- Board & Scores
  v_board_id UUID;
  v_board_status TEXT;
  v_board_was_created BOOLEAN := false;
  v_card_count INTEGER := 0;
  v_expected_card_count INTEGER := 0;
  v_round_score INTEGER;
  v_total_score INTEGER;
  v_pair_count INTEGER := 10; -- 10 pairs = 20 cards
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status, p.total_score INTO v_participant_id, v_room_id, v_room_status, v_total_score
  FROM public.arena_participants p
  JOIN public.arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Validate active round state
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM public.arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  IF v_game_type != 'memory_match' THEN
    RAISE EXCEPTION 'The current active round is not memory_match.';
  END IF;

  -- C. Fetch participant score
  SELECT COALESCE(round_score, 0) INTO v_round_score
  FROM public.arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  -- D. Acquire transactional advisory lock for this participant and round
  -- Serializes initialization so concurrent requests from the same player wait,
  -- while different players continue in parallel.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      v_round_id::text || ':' || v_participant_id::text,
      0
    )
  );

  -- E. Atomic board insertion with ON CONFLICT DO NOTHING
  INSERT INTO public.arena_memory_match_boards (
    room_id,
    round_id,
    participant_id,
    status
  )
  VALUES (
    v_room_id,
    v_round_id,
    v_participant_id,
    'active'
  )
  ON CONFLICT ON CONSTRAINT uq_arena_mm_board
  DO NOTHING
  RETURNING
    id,
    status
  INTO
    v_board_id,
    v_board_status;

  v_board_was_created := (v_board_id IS NOT NULL);

  -- If another concurrent transaction inserted the board first, retrieve it
  IF NOT v_board_was_created THEN
    SELECT
      b.id,
      b.status
    INTO
      v_board_id,
      v_board_status
    FROM public.arena_memory_match_boards AS b
    WHERE b.round_id = v_round_id
      AND b.participant_id = v_participant_id;
  END IF;

  IF v_board_id IS NULL THEN
    RAISE EXCEPTION
      'Memory Match board could not be created or recovered.'
      USING ERRCODE = 'P0001';
  END IF;

  -- F. Only the transaction that actually created the board generates cards
  IF v_board_was_created THEN
    WITH random_pairs AS (
      SELECT id FROM public.arena_memory_match_pairs WHERE is_active = true ORDER BY random() LIMIT v_pair_count
    ),
    cards_pool AS (
      SELECT rp.id AS pair_id, 'left'::text AS card_side FROM random_pairs rp
      UNION ALL
      SELECT rp.id AS pair_id, 'right'::text AS card_side FROM random_pairs rp
    ),
    shuffled_cards AS (
      SELECT pair_id, card_side, (row_number() OVER (ORDER BY random()) - 1)::integer AS pos
      FROM cards_pool
    )
    INSERT INTO public.arena_memory_match_cards (
      board_id,
      pair_id,
      card_side,
      position,
      status
    )
    SELECT
      v_board_id,
      pair_id,
      card_side,
      pos,
      'hidden'
    FROM shuffled_cards
    ON CONFLICT ON CONSTRAINT uq_arena_mm_card_pos
    DO NOTHING;
  END IF;

  -- G. Validate card count integrity
  SELECT COUNT(*)
  INTO v_card_count
  FROM public.arena_memory_match_cards
  WHERE board_id = v_board_id;

  v_expected_card_count := v_pair_count * 2;

  IF v_card_count <> v_expected_card_count THEN
    RAISE EXCEPTION
      'Invalid Memory Match board: expected % cards, found %.',
      v_expected_card_count,
      v_card_count
      USING ERRCODE = 'P0001';
  END IF;

  -- H. Return the cards. Secure rule: HIDE card labels if hidden!
  RETURN QUERY
  SELECT
    c.id as card_id,
    c.position,
    c.card_side,
    c.status,
    -- Return label ONLY IF card is revealed or matched, otherwise NULL!
    (CASE WHEN c.status IN ('revealed', 'matched') THEN 
       (CASE WHEN c.card_side = 'left' THEN p.left_label_pt ELSE p.right_label_pt END)
     ELSE NULL END) as label_pt,
    (CASE WHEN c.status IN ('revealed', 'matched') THEN 
       (CASE WHEN c.card_side = 'left' THEN p.left_label_en ELSE p.right_label_en END)
     ELSE NULL END) as label_en,
    v_round_score as round_score,
    v_total_score as total_score,
    GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
    (v_board_status = 'completed') as board_completed
  FROM public.arena_memory_match_cards c
  JOIN public.arena_memory_match_pairs p ON c.pair_id = p.id
  WHERE c.board_id = v_board_id
  ORDER BY c.position;

END;
$$;

-- 2. Update submit_memory_match_pair to also use 10 pairs (20 cards) and secure search_path
CREATE OR REPLACE FUNCTION public.submit_memory_match_pair(
  p_room_code TEXT,
  p_reconnect_token TEXT,
  p_first_card_id UUID,
  p_second_card_id UUID,
  p_request_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_match BOOLEAN,
  score_awarded INTEGER,
  updated_round_score INTEGER,
  updated_total_score INTEGER,
  board_completed BOOLEAN,
  first_pair_id UUID,
  second_pair_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_participant_id UUID;
  v_round_id UUID;
  v_ends_at TIMESTAMPTZ;
  v_game_type TEXT;
  
  -- Card checks
  v_board_id UUID;
  v_c1_pair_id UUID;
  v_c1_status TEXT;
  v_c2_pair_id UUID;
  v_c2_status TEXT;
  
  -- Attempt
  v_is_match BOOLEAN := false;
  v_score_awarded INTEGER := 0;
  v_updated_round_score INTEGER;
  v_updated_total_score INTEGER;
  
  -- Board completion
  v_unmatched_count INTEGER;
  v_board_completed BOOLEAN := false;
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id INTO v_participant_id, v_room_id
  FROM public.arena_participants p
  JOIN public.arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Fetch active round details
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM public.arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  -- Prevent duplicate/self submissions
  IF p_first_card_id = p_second_card_id THEN
    RAISE EXCEPTION 'Invalid selection: A card cannot be matched with itself.';
  END IF;

  -- C. Fetch both cards and verify they belong to this participant's board
  SELECT board_id, pair_id, status INTO v_board_id, v_c1_pair_id, v_c1_status
  FROM public.arena_memory_match_cards
  WHERE id = p_first_card_id;

  SELECT board_id, pair_id, status INTO v_board_id, v_c2_pair_id, v_c2_status
  FROM public.arena_memory_match_cards
  WHERE id = p_second_card_id;

  -- Verify ownership via board table
  IF NOT EXISTS (
    SELECT 1 FROM public.arena_memory_match_boards 
    WHERE id = v_board_id AND round_id = v_round_id AND participant_id = v_participant_id
  ) THEN
    RAISE EXCEPTION 'Card selection does not belong to your active board.';
  END IF;

  -- Ensure they are not already matched
  IF v_c1_status = 'matched' OR v_c2_status = 'matched' THEN
    RAISE EXCEPTION 'One or both of these cards are already matched.';
  END IF;

  -- D. Determine match
  IF v_c1_pair_id = v_c2_pair_id THEN
    v_is_match := true;
    v_score_awarded := 10; -- 10 points per successful match
    
    -- Mark cards as matched
    UPDATE public.arena_memory_match_cards
    SET status = 'matched', matched_at = NOW(), updated_at = NOW()
    WHERE id IN (p_first_card_id, p_second_card_id);
    
    -- Check if board is completed (any unmatched left?)
    SELECT COUNT(*)::integer INTO v_unmatched_count
    FROM public.arena_memory_match_cards
    WHERE board_id = v_board_id AND status != 'matched';
    
    IF v_unmatched_count = 0 THEN
      v_board_completed := true;
      UPDATE public.arena_memory_match_boards
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = v_board_id;
    END IF;
  ELSE
    -- Revert back to hidden
    UPDATE public.arena_memory_match_cards
    SET status = 'hidden', revealed_at = NULL, updated_at = NOW()
    WHERE id IN (p_first_card_id, p_second_card_id);
  END IF;

  -- E. Log the attempt
  INSERT INTO public.arena_memory_match_attempts (
    room_id, round_id, board_id, participant_id, first_card_id, second_card_id, is_match, score_awarded, request_id
  ) VALUES (
    v_room_id, v_round_id, v_board_id, v_participant_id, p_first_card_id, p_second_card_id, v_is_match, v_score_awarded, p_request_id
  );

  -- F. Update scores if match was found
  IF v_score_awarded > 0 THEN
    UPDATE public.arena_round_participants
    SET round_score = round_score + v_score_awarded,
        updated_at = NOW()
    WHERE round_id = v_round_id AND participant_id = v_participant_id;

    UPDATE public.arena_participants
    SET total_score = total_score + v_score_awarded,
        last_seen_at = NOW()
    WHERE id = v_participant_id;
  END IF;

  -- G. Fetch updated score values
  SELECT round_score INTO v_updated_round_score
  FROM public.arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  SELECT total_score INTO v_updated_total_score
  FROM public.arena_participants
  WHERE id = v_participant_id;

  -- H. If board was completed, automatically provision a fresh board with 10 pairs (20 cards)
  IF v_board_completed THEN
    DELETE FROM public.arena_memory_match_cards WHERE board_id = v_board_id;
    
    WITH random_pairs AS (
      SELECT id FROM public.arena_memory_match_pairs WHERE is_active = true ORDER BY random() LIMIT 10
    ),
    cards_pool AS (
      SELECT rp.id AS pair_id, 'left'::text AS card_side FROM random_pairs rp
      UNION ALL
      SELECT rp.id AS pair_id, 'right'::text AS card_side FROM random_pairs rp
    ),
    shuffled_cards AS (
      SELECT pair_id, card_side, (row_number() OVER (ORDER BY random()) - 1)::integer AS pos
      FROM cards_pool
    )
    INSERT INTO public.arena_memory_match_cards (board_id, pair_id, card_side, position, status)
    SELECT v_board_id, pair_id, card_side, pos, 'hidden'
    FROM shuffled_cards
    ON CONFLICT ON CONSTRAINT uq_arena_mm_card_pos DO NOTHING;
  END IF;

  RETURN QUERY SELECT
    v_is_match,
    v_score_awarded,
    COALESCE(v_updated_round_score, 0),
    COALESCE(v_updated_total_score, 0),
    v_board_completed,
    v_c1_pair_id,
    v_c2_pair_id;
END;
$$;

-- 3. Update reveal_memory_match_card to ensure search_path is set consistently
CREATE OR REPLACE FUNCTION public.reveal_memory_match_card(
  p_room_code TEXT,
  p_reconnect_token TEXT,
  p_card_id UUID
)
RETURNS TABLE (
  card_id UUID,
  position INTEGER,
  card_side TEXT,
  status TEXT,
  label_pt TEXT,
  label_en TEXT,
  remaining_round_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_participant_id UUID;
  v_round_id UUID;
  v_ends_at TIMESTAMPTZ;
  v_game_type TEXT;
  
  -- Card details
  v_board_id UUID;
  v_card_pair_id UUID;
  v_card_side TEXT;
  v_card_pos INTEGER;
  v_card_status TEXT;
  v_pair_left_pt TEXT;
  v_pair_left_en TEXT;
  v_pair_right_pt TEXT;
  v_pair_right_en TEXT;
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id INTO v_participant_id, v_room_id
  FROM public.arena_participants p
  JOIN public.arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Validate active round
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM public.arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  -- C. Fetch card details
  SELECT board_id, pair_id, card_side, position, status
  INTO v_board_id, v_card_pair_id, v_card_side, v_card_pos, v_card_status
  FROM public.arena_memory_match_cards
  WHERE id = p_card_id;

  IF v_board_id IS NULL THEN
    RAISE EXCEPTION 'Card does not exist.';
  END IF;

  -- Verify board belongs to participant
  IF NOT EXISTS (
    SELECT 1 FROM public.arena_memory_match_boards
    WHERE id = v_board_id AND round_id = v_round_id AND participant_id = v_participant_id
  ) THEN
    RAISE EXCEPTION 'Card does not belong to your active board.';
  END IF;

  -- If card is already matched, return it immediately without state changes
  IF v_card_status = 'matched' THEN
    SELECT left_label_pt, left_label_en, right_label_pt, right_label_en
    INTO v_pair_left_pt, v_pair_left_en, v_pair_right_pt, v_pair_right_en
    FROM public.arena_memory_match_pairs
    WHERE id = v_card_pair_id;

    RETURN QUERY
    SELECT
      p_card_id as card_id,
      v_card_pos as position,
      v_card_side as card_side,
      v_card_status as status,
      (CASE WHEN v_card_side = 'left' THEN v_pair_left_pt ELSE v_pair_right_pt END) as label_pt,
      (CASE WHEN v_card_side = 'left' THEN v_pair_left_en ELSE v_pair_right_en END) as label_en,
      GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds;
    RETURN;
  END IF;

  -- Reveal the card
  UPDATE public.arena_memory_match_cards
  SET status = 'revealed', revealed_at = NOW(), updated_at = NOW()
  WHERE id = p_card_id;

  SELECT left_label_pt, left_label_en, right_label_pt, right_label_en
  INTO v_pair_left_pt, v_pair_left_en, v_pair_right_pt, v_pair_right_en
  FROM public.arena_memory_match_pairs
  WHERE id = v_card_pair_id;

  RETURN QUERY
  SELECT
    p_card_id as card_id,
    v_card_pos as position,
    v_card_side as card_side,
    v_card_status as status,
    (CASE WHEN v_card_side = 'left' THEN v_pair_left_pt ELSE v_pair_right_pt END) as label_pt,
    (CASE WHEN v_card_side = 'left' THEN v_pair_left_en ELSE v_pair_right_en END) as label_en,
    GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds;

END;
$$;

-- 4. Ensure Permissions on all functions
GRANT EXECUTE ON FUNCTION public.get_memory_match_round_state(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_memory_match_pair(text, text, uuid, uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reveal_memory_match_card(text, text, uuid) TO anon, authenticated, service_role;

-- Migration v9: Memory Match Authoritative Multiplayer Pairs Game
-- Creates the arena_memory_match_pairs, arena_memory_match_boards, arena_memory_match_cards, and arena_memory_match_attempts tables, adds RLS, triggers, and RPC validation.

-- 1. Create arena_memory_match_pairs table
CREATE TABLE IF NOT EXISTS arena_memory_match_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_key TEXT NOT NULL UNIQUE,
    left_label_pt TEXT NOT NULL,
    left_label_en TEXT NOT NULL,
    right_label_pt TEXT NOT NULL,
    right_label_en TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE arena_memory_match_pairs ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can select active pairs
CREATE POLICY "Allow select active pairs" ON arena_memory_match_pairs
  FOR SELECT USING (is_active = true);

-- Seed Poke House themed pairs (16 high-quality bilingual pairs)
INSERT INTO arena_memory_match_pairs (pair_key, left_label_pt, left_label_en, right_label_pt, right_label_en, category) VALUES
('salmon', 'Salmão', 'Salmon', 'Salmão Grelhado / Fresco', 'Grilled / Fresh Salmon', 'PROTEIN'),
('tuna', 'Atum', 'Tuna', 'Atum Spicy / Fresco', 'Spicy / Fresh Tuna', 'PROTEIN'),
('sushi_rice', 'Arroz de Sushi', 'Sushi Rice', 'Base tradicional temperada', 'Traditional seasoned base', 'BASE'),
('brown_rice', 'Arroz Integral', 'Brown Rice', 'Base saudável rica em fibra', 'Healthy fiber-rich base', 'BASE'),
('mango', 'Manga', 'Mango', 'Fruta doce tropical', 'Sweet tropical fruit', 'GREEN'),
('avocado', 'Abacate', 'Avocado', 'Topping cremoso saudável', 'Healthy creamy topping', 'GREEN'),
('wakame', 'Algas Wakame', 'Wakame Seaweed', 'Algas temperadas sésamo', 'Sesame seasoned seaweed', 'GREEN'),
('crispy_onion', 'Cebola Frita', 'Crispy Onion', 'Topping estaladiço salgado', 'Salty crunchy topping', 'CRISPY'),
('sesame_seeds', 'Sementes de Sésamo', 'Sesame Seeds', 'Topping de cortesia gratuito', 'Complimentary free topping', 'SESAME'),
('teriyaki', 'Molho Teriyaki', 'Teriyaki Sauce', 'Molho doce japonês', 'Sweet Japanese sauce', 'SAUCE'),
('soy_sauce', 'Molho de Soja', 'Soy Sauce', 'Molho salgado tradicional', 'Traditional salty sauce', 'SAUCE'),
('foh', 'Frente de Loja (FOH)', 'Front of House (FOH)', 'Área de atendimento ao cliente', 'Customer facing area', 'OPERATIONS'),
('boh', 'Cozinha (BOH)', 'Back of House (BOH)', 'Área de preparação de alimentos', 'Food preparation area', 'OPERATIONS'),
('haccp', 'Segurança Alimentar', 'Food Safety', 'Sistema de prevenção HACCP', 'HACCP prevention system', 'SAFETY'),
('cozy_chicken', 'Frango Vietnamita', 'Vietnamese Chicken', 'Proteína da Cozy Chicken', 'Cozy Chicken protein', 'RECIPE'),
('crispy_shrimp', 'Camarão Panado', 'Breaded Shrimp', 'Proteína do Crispy Shrimp', 'Crispy Shrimp protein', 'RECIPE')
ON CONFLICT (pair_key) DO UPDATE SET
  left_label_pt = EXCLUDED.left_label_pt,
  left_label_en = EXCLUDED.left_label_en,
  right_label_pt = EXCLUDED.right_label_pt,
  right_label_en = EXCLUDED.right_label_en,
  category = EXCLUDED.category;

-- 2. Create arena_memory_match_boards table
CREATE TABLE IF NOT EXISTS arena_memory_match_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_arena_mm_board UNIQUE (round_id, participant_id),
    CONSTRAINT chk_arena_mm_board_status CHECK (status IN ('active', 'completed'))
);

-- Enable RLS
ALTER TABLE arena_memory_match_boards ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view boards (or select own board)
CREATE POLICY "Allow select own board" ON arena_memory_match_boards
  FOR SELECT USING (true);

-- 3. Create arena_memory_match_cards table
CREATE TABLE IF NOT EXISTS arena_memory_match_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES arena_memory_match_boards(id) ON DELETE CASCADE,
    pair_id UUID NOT NULL REFERENCES arena_memory_match_pairs(id),
    card_side TEXT NOT NULL,
    position INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'hidden',
    revealed_at TIMESTAMPTZ,
    matched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_arena_mm_card_pos UNIQUE (board_id, position),
    CONSTRAINT chk_arena_mm_card_status CHECK (status IN ('hidden', 'revealed', 'matched')),
    CONSTRAINT chk_arena_mm_card_side CHECK (card_side IN ('left', 'right'))
);

-- Enable RLS
ALTER TABLE arena_memory_match_cards ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow viewing of board cards
CREATE POLICY "Allow select board cards" ON arena_memory_match_cards
  FOR SELECT USING (true);

-- 4. Create arena_memory_match_attempts table
CREATE TABLE IF NOT EXISTS arena_memory_match_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES arena_memory_match_boards(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
    first_card_id UUID NOT NULL REFERENCES arena_memory_match_cards(id) ON DELETE CASCADE,
    second_card_id UUID NOT NULL REFERENCES arena_memory_match_cards(id) ON DELETE CASCADE,
    is_match BOOLEAN NOT NULL,
    score_awarded INTEGER NOT NULL DEFAULT 0,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE arena_memory_match_attempts ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow select own attempts
CREATE POLICY "Allow select own attempts" ON arena_memory_match_attempts
  FOR SELECT USING (true);


-- 5. Create or Replace start_arena_round with dynamic duration based on game type
CREATE OR REPLACE FUNCTION start_arena_round(
  p_room_id UUID,
  p_round_number INTEGER,
  p_game_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round_id UUID;
  v_status TEXT;
  v_duration INTERVAL;
BEGIN
  SELECT status INTO v_status FROM arena_rooms WHERE id = p_room_id;
  IF v_status != 'active' THEN
    RAISE EXCEPTION 'Action Denied: Tournament is not in an active state.';
  END IF;

  IF p_game_type NOT IN ('slop_clock', 'quick_think', 'memory_match') THEN
    RAISE EXCEPTION 'Invalid Game type selected: %', p_game_type;
  END IF;

  -- Set duration based on game type (official, server-authoritative round timestamps)
  IF p_game_type = 'memory_match' THEN
    v_duration := INTERVAL '300 seconds'; -- 5 minutes memory trainer
  ELSIF p_game_type = 'quick_think' THEN
    v_duration := INTERVAL '300 seconds'; -- 15 questions x 20 seconds
  ELSE
    v_duration := INTERVAL '60 seconds'; -- slop_clock is 60 seconds
  END IF;

  -- Complete previous rounds
  UPDATE arena_rounds
  SET status = 'completed', completed_at = NOW()
  WHERE room_id = p_room_id AND status = 'active';

  -- Create round with dynamic duration
  INSERT INTO arena_rounds (room_id, round_number, game_type, status, starts_at, ends_at)
  VALUES (p_room_id, p_round_number, p_game_type, 'active', NOW(), NOW() + v_duration)
  RETURNING id INTO v_round_id;

  -- Set room pointers
  UPDATE arena_rooms
  SET current_round_number = p_round_number,
      current_game_type = p_game_type
  WHERE id = p_room_id;

  -- Set active participant states to playing
  UPDATE arena_participants
  SET status = 'playing'
  WHERE room_id = p_room_id AND is_active = true;

  -- Map active players to round stats
  INSERT INTO arena_round_participants (room_id, round_id, participant_id, joined_late, round_start_score, round_score, status)
  SELECT p_room_id, v_round_id, id, false, total_score, 0, 'active'
  FROM arena_participants
  WHERE room_id = p_room_id AND is_active = true;

  INSERT INTO arena_events (room_id, event_type, payload)
  VALUES (p_room_id, 'round_started', jsonb_build_object('round_number', p_round_number, 'game_type', p_game_type));

  RETURN v_round_id;
END;
$$;


-- 6. Create RPC function to retrieve/generate memory match board securely
CREATE OR REPLACE FUNCTION get_memory_match_round_state(
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
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_room_status TEXT;
  v_participant_id UUID;
  v_round_id UUID;
  v_ends_at TIMESTAMPTZ;
  v_game_type TEXT;
  
  -- Board
  v_board_id UUID;
  v_board_status TEXT;
  v_round_score INTEGER;
  v_total_score INTEGER;
  v_pair_count INTEGER := 8; -- 8 pairs = 16 cards
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status, p.total_score INTO v_participant_id, v_room_id, v_room_status, v_total_score
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Validate active round state
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  IF v_game_type != 'memory_match' THEN
    RAISE EXCEPTION 'The current active round is not memory_match.';
  END IF;

  -- C. Fetch participant score
  SELECT COALESCE(round_score, 0) INTO v_round_score
  FROM arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  -- D. Check if board exists
  SELECT id, status INTO v_board_id, v_board_status
  FROM arena_memory_match_boards
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  -- E. If board doesn't exist, generate a brand-new shuffled board
  IF v_board_id IS NULL THEN
    INSERT INTO arena_memory_match_boards (room_id, round_id, participant_id, status)
    VALUES (v_room_id, v_round_id, v_participant_id, 'active')
    RETURNING id, status INTO v_board_id, v_board_status;

    -- Draw 8 random active pairs and insert 16 cards (8 left, 8 right) in randomized positions (0 to 15)
    WITH random_pairs AS (
      SELECT id FROM arena_memory_match_pairs WHERE is_active = true ORDER BY random() LIMIT v_pair_count
    ),
    cards_pool AS (
      SELECT rp.id AS pair_id, 'left' AS card_side FROM random_pairs rp
      UNION ALL
      SELECT rp.id AS pair_id, 'right' AS card_side FROM random_pairs rp
    ),
    shuffled_cards AS (
      SELECT pair_id, card_side, row_number() OVER (ORDER BY random()) - 1 AS pos
      FROM cards_pool
    )
    INSERT INTO arena_memory_match_cards (board_id, pair_id, card_side, position, status)
    SELECT v_board_id, pair_id, card_side, pos::integer, 'hidden'
    FROM shuffled_cards;
  END IF;

  -- F. Return the cards. Secure rule: HIDE card labels if hidden!
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
  FROM arena_memory_match_cards c
  JOIN arena_memory_match_pairs p ON c.pair_id = p.id
  WHERE c.board_id = v_board_id
  ORDER BY c.position;

END;
$$;


-- 7. Create RPC function to reveal card securely
CREATE OR REPLACE FUNCTION reveal_memory_match_card(
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
SET search_path = public
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
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Fetch active round details
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  -- C. Fetch card and verify it belongs to this participant's board
  SELECT c.board_id, c.pair_id, c.card_side, c.position, c.status INTO v_board_id, v_card_pair_id, v_card_side, v_card_pos, v_card_status
  FROM arena_memory_match_cards c
  JOIN arena_memory_match_boards b ON c.board_id = b.id
  WHERE c.id = p_card_id AND b.round_id = v_round_id AND b.participant_id = v_participant_id;

  IF v_board_id IS NULL THEN
    RAISE EXCEPTION 'Card not found on your current board.';
  END IF;

  -- D. If already matched or revealed, just return it without updates
  IF v_card_status = 'hidden' THEN
    UPDATE arena_memory_match_cards
    SET status = 'revealed', revealed_at = NOW(), updated_at = NOW()
    WHERE id = p_card_id;
    v_card_status := 'revealed';
  END IF;

  -- E. Fetch parent pair labels
  SELECT left_label_pt, left_label_en, right_label_pt, right_label_en 
  INTO v_pair_left_pt, v_pair_left_en, v_pair_right_pt, v_pair_right_en
  FROM arena_memory_match_pairs
  WHERE id = v_card_pair_id;

  -- F. Return revealed card details
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


-- 8. Create RPC function to submit and validate a pair of cards securely
CREATE OR REPLACE FUNCTION submit_memory_match_pair(
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
SET search_path = public
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
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Fetch active round details
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM arena_rounds
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
  FROM arena_memory_match_cards
  WHERE id = p_first_card_id;

  SELECT board_id, pair_id, status INTO v_board_id, v_c2_pair_id, v_c2_status
  FROM arena_memory_match_cards
  WHERE id = p_second_card_id;

  -- Verify ownership via board table
  IF NOT EXISTS (
    SELECT 1 FROM arena_memory_match_boards 
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
    UPDATE arena_memory_match_cards
    SET status = 'matched', matched_at = NOW(), updated_at = NOW()
    WHERE id IN (p_first_card_id, p_second_card_id);
    
    -- Check if board is completed (any unmatched left?)
    SELECT COUNT(*)::integer INTO v_unmatched_count
    FROM arena_memory_match_cards
    WHERE board_id = v_board_id AND status != 'matched';
    
    IF v_unmatched_count = 0 THEN
      v_board_completed := true;
      UPDATE arena_memory_match_boards
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = v_board_id;
    END IF;
  ELSE
    -- Revert back to hidden
    UPDATE arena_memory_match_cards
    SET status = 'hidden', revealed_at = NULL, updated_at = NOW()
    WHERE id IN (p_first_card_id, p_second_card_id);
  END IF;

  -- E. Log the attempt
  INSERT INTO arena_memory_match_attempts (
    room_id, round_id, board_id, participant_id, first_card_id, second_card_id, is_match, score_awarded, request_id
  ) VALUES (
    v_room_id, v_round_id, v_board_id, v_participant_id, p_first_card_id, p_second_card_id, v_is_match, v_score_awarded, p_request_id
  );

  -- F. Update scores if match was found
  IF v_score_awarded > 0 THEN
    UPDATE arena_round_participants
    SET round_score = round_score + v_score_awarded,
        updated_at = NOW()
    WHERE round_id = v_round_id AND participant_id = v_participant_id;

    UPDATE arena_participants
    SET total_score = total_score + v_score_awarded,
        last_seen_at = NOW()
    WHERE id = v_participant_id;
  END IF;

  -- G. Fetch updated score values
  SELECT round_score INTO v_updated_round_score
  FROM arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  SELECT total_score INTO v_updated_total_score
  FROM arena_participants
  WHERE id = v_participant_id;

  -- H. If board was completed, automatically provision a fresh board so they can continue playing!
  IF v_board_completed THEN
    DELETE FROM arena_memory_match_cards WHERE board_id = v_board_id;
    
    WITH random_pairs AS (
      SELECT id FROM arena_memory_match_pairs WHERE is_active = true ORDER BY random() LIMIT 8
    ),
    cards_pool AS (
      SELECT rp.id AS pair_id, 'left' AS card_side FROM random_pairs rp
      UNION ALL
      SELECT rp.id AS pair_id, 'right' AS card_side FROM random_pairs rp
    ),
    shuffled_cards AS (
      SELECT pair_id, card_side, row_number() OVER (ORDER BY random()) - 1 AS pos
      FROM cards_pool
    )
    INSERT INTO arena_memory_match_cards (board_id, pair_id, card_side, position, status)
    SELECT v_board_id, pair_id, card_side, pos::integer, 'hidden'
    FROM shuffled_cards;
    
    UPDATE arena_memory_match_boards
    SET status = 'active', completed_at = NULL, updated_at = NOW()
    WHERE id = v_board_id;
    
    v_board_completed := false;
  END IF;

  RETURN QUERY
  SELECT
    v_is_match as is_match,
    v_score_awarded as score_awarded,
    v_updated_round_score as updated_round_score,
    v_updated_total_score as updated_total_score,
    v_board_completed as board_completed,
    v_c1_pair_id as first_pair_id,
    v_c2_pair_id as second_pair_id;

END;
$$;

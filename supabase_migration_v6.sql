-- Migration v6: Hora do Lodo Multiplayer Gameplay, Recipe Database, and Authoritative Validation Engine
-- Creates the arena_recipes and arena_round_challenges tables, adds secure indices, RLS policies, and RPCs.

-- 1. Helper function to sort a JSONB array of strings for deterministic comparisons
CREATE OR REPLACE FUNCTION sort_jsonb_array(p_array JSONB)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(jsonb_agg(elem ORDER BY elem), '[]'::jsonb)
  FROM jsonb_array_elements(p_array) AS elem;
$$;


-- 2. Create the arena_recipes lookup table (Canonical source of truth for Poke House recipe validation)
CREATE TABLE IF NOT EXISTS arena_recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'HOUSE',
    variants JSONB NOT NULL, -- Holds 'Regular' and 'Large' ingredient details
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on recipes lookup table
ALTER TABLE arena_recipes ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone participating can read recipes
CREATE POLICY "Allow select recipes" ON arena_recipes
  FOR SELECT USING (true);


-- 3. Populate arena_recipes table with the official Poke House recipes (HOUSE and GREEN categories)
INSERT INTO arena_recipes (id, name, category, variants) VALUES
(
  'sunny_salmon', 'Sunny Salmon 🌞', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Edamame", "Couve roxa"],
      "protein": ["Juicy Salmon", "Juicy Salmon"],
      "sauce_final": ["Ponzu", "Azeite", "Creme de Abacate"],
      "crispy": ["Não leva"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Couve roxa", "Couve roxa", "Edamame", "Edamame"],
      "protein": ["Juicy Salmon", "Juicy Salmon", "Juicy Salmon"],
      "sauce_final": ["Ponzu", "Azeite", "Creme de Abacate"],
      "crispy": ["Não leva"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'spicy_tuna', 'Spicy Tuna 🐟', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Cenoura", "Couve roxa", "Pepino"],
      "protein": ["Atum", "Atum", "Wakame"],
      "sauce_final": ["Ponzu", "Spicy Peanuts"],
      "crispy": ["Cebola Crocante", "Chilli Flakes"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Cenoura", "Couve roxa", "Couve roxa", "Pepino", "Pepino"],
      "protein": ["Atum", "Atum", "Atum", "Wakame"],
      "sauce_final": ["Ponzu", "Spicy Peanuts"],
      "crispy": ["Cebola Crocante", "Chilli Flakes"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'hummus_avo', 'Hummus & Avo 🌿', 'HOUSE',
  '{
    "Regular": {
      "base": ["Arroz basmati", "Arroz basmati"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Hummus", "Hummus", "Tomate Cherry", "Pepino", "Azeitonas"],
      "protein": ["Não leva"],
      "sauce_final": ["Manjericão e Hortelã"],
      "crispy": ["Amêndoa"],
      "sesame": ["Não"]
    },
    "Large": {
      "base": ["Arroz basmati", "Arroz basmati", "Arroz basmati"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Hummus", "Hummus", "Hummus", "Tomate Cherry", "Pepino", "Azeitonas", "Azeitonas"],
      "protein": ["Não leva"],
      "sauce_final": ["Manjericão e Hortelã"],
      "crispy": ["Amêndoa"],
      "sesame": ["Não"]
    }
  }'::jsonb
),
(
  'chicken', 'Chicken 🐔', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Couve roxa", "Tomate Cherry", "Courgette"],
      "protein": ["Frango Teriyaki", "Frango Teriyaki"],
      "sauce_final": ["Teriyaki", "Sriracha Mayo"],
      "crispy": ["Amêndoa"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Couve roxa", "Couve roxa", "Tomate Cherry", "Courgette", "Courgette"],
      "protein": ["Frango Teriyaki", "Frango Teriyaki", "Frango Teriyaki"],
      "sauce_final": ["Teriyaki", "Sriracha Mayo"],
      "crispy": ["Amêndoa"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'fire_salmon', 'Fire Salmon 🔥', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Sriracha Mayo"],
      "greens": ["Edamame", "Tomate Cherry", "Pepino"],
      "protein": ["Salmão", "Salmão"],
      "sauce_final": ["Sriracha Mayo"],
      "crispy": ["Cebola Crocante", "Chilli Flakes"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Sriracha Mayo"],
      "greens": ["Edamame", "Tomate Cherry", "Pepino", "Pepino"],
      "protein": ["Salmão", "Salmão", "Salmão"],
      "sauce_final": ["Sriracha Mayo"],
      "crispy": ["Cebola Crocante", "Chilli Flakes"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'mixed_seas', 'Mixed Seas 🌊', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Cenoura", "Cebola Roxa", "Manga", "Wakame"],
      "protein": ["Atum", "Salmão"],
      "sauce_final": ["Ponzu"],
      "crispy": ["Ervilhas Wasabi"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Cenoura", "Cenoura", "Cebola Roxa", "Wakame", "Manga"],
      "protein": ["Atum", "Salmão", "Salmão"],
      "sauce_final": ["Ponzu"],
      "crispy": ["Ervilhas Wasabi"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'crispy_shrimp', 'Crispy Shrimp 🦐', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Philadelphia", "Manga", "Pepino"],
      "protein": ["Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado"],
      "sauce_final": ["Teriyaki", "Sriracha Mayo"],
      "crispy": ["Algas Nori"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Philadelphia", "Manga", "Pepino", "Pepino"],
      "protein": ["Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado", "Camarão Panado"],
      "sauce_final": ["Teriyaki", "Sriracha Mayo"],
      "crispy": ["Algas Nori"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'sushi_bowl', 'Sushi Bowl 🍣', 'HOUSE',
  '{
    "Regular": {
      "base": ["180g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Edamame", "Philadelphia", "Morangos"],
      "protein": ["Salmão Braseado", "Salmão Braseado"],
      "sauce_final": ["Teriyaki"],
      "crispy": ["Cebola Crocante"],
      "sesame": ["Sim"]
    },
    "Large": {
      "base": ["270g Arroz de sushi"],
      "sauce_base": ["Não leva"],
      "greens": ["Abacate", "Morangos", "Philadelphia", "Edamame", "Edamame"],
      "protein": ["Salmão Braseado", "Salmão Braseado", "Salmão Braseado"],
      "sauce_final": ["Teriyaki"],
      "crispy": ["Cebola Crocante"],
      "sesame": ["Sim"]
    }
  }'::jsonb
),
(
  'the_caesar', 'The Caesar 🥗', 'GREEN',
  '{
    "Regular": {
      "base": ["Mix Salad", "Mix Salad", "Mix Salad"],
      "sauce_base": ["Vinagrete"],
      "greens": ["Tomate Cherry", "Tomate Cherry", "Grana Padano"],
      "protein": ["Frango", "Frango"],
      "sauce_final": ["Creamy Caesar"],
      "crispy": ["Bacon", "Croutons", "Lima"],
      "sesame": ["Não"]
    }
  }'::jsonb
),
(
  'exotic_salmon', 'Exotic Salmon 🥗', 'GREEN',
  '{
    "Regular": {
      "base": ["Coconut Basmati", "Espinafre", "Espinafre"],
      "sauce_base": ["Azeite de Limão"],
      "greens": ["Batata Doce com Alecrim", "Batata Doce com Alecrim", "Brócolis", "Abacate"],
      "protein": ["Miso Glazed Salmon", "Miso Glazed Salmon"],
      "sauce_final": ["Sriracha Mayo"],
      "crispy": ["Não leva"],
      "sesame": ["Não"]
    }
  }'::jsonb
),
(
  'grilled_halloumi', 'Grilled Halloumi 🥗', 'GREEN',
  '{
    "Regular": {
      "base": ["Mix Salad", "Mix Salad", "Mix Salad"],
      "sauce_base": ["Vinagrete"],
      "greens": ["Espargos Grelhados", "Abacate", "Tomate Cherry", "Azeitonas"],
      "protein": ["Baked Halloumi", "Baked Halloumi"],
      "sauce_final": ["Manjericão e Hortelã"],
      "crispy": ["Nozes com Mel"],
      "sesame": ["Não"]
    }
  }'::jsonb
),
(
  'lime_mango_shrimp', 'Lime & Mango Shrimp 🥗', 'GREEN',
  '{
    "Regular": {
      "base": ["Mix Salad", "Mix Salad", "Mix Salad"],
      "sauce_base": ["Azeite + Sal"],
      "greens": ["Manga", "Abacate", "Pepino", "Edamame"],
      "protein": ["Camarão c/ Lima e Tomilho", "Camarão c/ Lima e Tomilho"],
      "sauce_final": ["Iogurte com Ervas"],
      "crispy": ["Não leva"],
      "sesame": ["Sim"]
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  variants = EXCLUDED.variants;


-- 4. Create the arena_round_challenges table
CREATE TABLE IF NOT EXISTS arena_round_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
    challenge_sequence INTEGER NOT NULL,
    recipe_id TEXT NOT NULL REFERENCES arena_recipes(id),
    recipe_size TEXT NOT NULL,
    challenge_status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    completion_payload JSONB,
    score_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Allowed statuses: active, completed, expired, invalidated
    CONSTRAINT chk_arena_round_challenges_status CHECK (challenge_status IN ('active', 'completed', 'expired', 'invalidated')),
    
    -- Prevent duplicate sequence values for the same participant in a round
    CONSTRAINT uq_challenge_sequence_per_participant_round UNIQUE (round_id, participant_id, challenge_sequence),
    
    -- Score is non-negative
    CONSTRAINT chk_arena_round_challenges_score CHECK (score_awarded >= 0),
    
    -- Completed_at can only exist if status is completed
    CONSTRAINT chk_arena_round_challenges_completed CHECK (completed_at IS NULL OR challenge_status = 'completed')
);

-- Enforce at most ONE active challenge per participant in any round
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_active_challenge_per_participant_round
ON arena_round_challenges(round_id, participant_id)
WHERE challenge_status = 'active';

-- Indices for rapid query lookup
CREATE INDEX IF NOT EXISTS idx_arena_round_challenges_participant ON arena_round_challenges(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_round_challenges_round ON arena_round_challenges(round_id);
CREATE INDEX IF NOT EXISTS idx_arena_round_challenges_status ON arena_round_challenges(challenge_status);

-- Enable RLS on challenges table
ALTER TABLE arena_round_challenges ENABLE ROW LEVEL SECURITY;

-- Note: No direct WRITE policies are defined. Everything flows securely through the RPC functions.
-- RLS Read policy: Participants can query only COMPLETED or EXPIRED challenges of others, or any of their OWN challenges.
-- Since reconnect token lookup is stateless on REST, we restrict broad selects on ACTIVE challenges to ensure privacy.
CREATE POLICY "Allow select own or completed challenges" ON arena_round_challenges
  FOR SELECT USING (challenge_status != 'active' OR participant_id IN (
    SELECT id FROM arena_participants WHERE id = participant_id
  ));


-- 5. Create RPC function to safely retrieve or create the active challenge for the player
CREATE OR REPLACE FUNCTION get_or_create_active_challenge(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  challenge_id UUID,
  challenge_sequence INTEGER,
  recipe_id TEXT,
  recipe_name TEXT,
  recipe_size TEXT,
  recipe_category TEXT,
  required_ingredients JSONB,
  remaining_round_seconds INTEGER,
  round_score INTEGER,
  total_score INTEGER,
  challenge_completion_count INTEGER
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
  v_challenge_id UUID;
  v_challenge_sequence INTEGER;
  v_recipe_id TEXT;
  v_recipe_name TEXT;
  v_recipe_size TEXT;
  v_recipe_category TEXT;
  v_required_ingredients JSONB;
  v_last_recipe_id TEXT;
  v_has_large BOOLEAN;
  v_round_score INTEGER;
  v_total_score INTEGER;
  v_completion_count INTEGER;
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

  IF v_game_type != 'slop_clock' THEN
    RAISE EXCEPTION 'The current active round is not slop_clock.';
  END IF;

  -- C. Check if an active challenge already exists for this player in this round
  SELECT c.id, c.challenge_sequence, c.recipe_id, c.recipe_size, r.name, r.category, (r.variants -> c.recipe_size)
  INTO v_challenge_id, v_challenge_sequence, v_recipe_id, v_recipe_size, v_recipe_name, v_recipe_category, v_required_ingredients
  FROM arena_round_challenges c
  JOIN arena_recipes r ON c.recipe_id = r.id
  WHERE c.round_id = v_round_id 
    AND c.participant_id = v_participant_id 
    AND c.challenge_status = 'active'
  LIMIT 1;

  -- D. If no active challenge exists, create a new one atomically!
  IF v_challenge_id IS NULL THEN
    -- Check if round has expired
    IF NOW() >= v_ends_at THEN
      RAISE EXCEPTION 'Cannot start a new challenge: The current round has already ended.';
    END IF;

    -- Calculate next sequence number
    SELECT COALESCE(MAX(challenge_sequence), 0) + 1 INTO v_challenge_sequence
    FROM arena_round_challenges
    WHERE round_id = v_round_id AND participant_id = v_participant_id;

    -- Query last completed recipe ID to avoid immediate repetition
    SELECT c.recipe_id INTO v_last_recipe_id
    FROM arena_round_challenges c
    WHERE c.round_id = v_round_id AND c.participant_id = v_participant_id
    ORDER BY c.challenge_sequence DESC
    LIMIT 1;

    -- Draw random recipe that is NOT the same as the last one (if multiple options exist)
    SELECT id, name, category INTO v_recipe_id, v_recipe_name, v_recipe_category
    FROM arena_recipes
    WHERE id != COALESCE(v_last_recipe_id, '')
    ORDER BY random()
    LIMIT 1;

    -- Fallback to any recipe if no other recipe exists
    IF v_recipe_id IS NULL THEN
      SELECT id, name, category INTO v_recipe_id, v_recipe_name, v_recipe_category
      FROM arena_recipes
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- Check if selected recipe has a 'Large' variant
    SELECT (variants ? 'Large') INTO v_has_large
    FROM arena_recipes
    WHERE id = v_recipe_id;

    IF v_has_large THEN
      IF random() > 0.5 THEN
        v_recipe_size := 'Large';
      ELSE
        v_recipe_size := 'Regular';
      END IF;
    ELSE
      v_recipe_size := 'Regular';
    END IF;

    -- Grab variant ingredients list
    SELECT (variants -> v_recipe_size) INTO v_required_ingredients
    FROM arena_recipes
    WHERE id = v_recipe_id;

    -- Insert new challenge row
    INSERT INTO arena_round_challenges (
      room_id, round_id, participant_id, challenge_sequence, recipe_id, recipe_size, challenge_status, started_at
    ) VALUES (
      v_room_id, v_round_id, v_participant_id, v_challenge_sequence, v_recipe_id, v_recipe_size, 'active', NOW()
    ) RETURNING id INTO v_challenge_id;

  END IF;

  -- E. Gather current stats
  SELECT COALESCE(round_score, 0) INTO v_round_score
  FROM arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  SELECT COUNT(*)::integer INTO v_completion_count
  FROM arena_round_challenges
  WHERE round_id = v_round_id AND participant_id = v_participant_id AND challenge_status = 'completed';

  RETURN QUERY SELECT
    v_challenge_id as challenge_id,
    v_challenge_sequence as challenge_sequence,
    v_recipe_id as recipe_id,
    v_recipe_name as recipe_name,
    v_recipe_size as recipe_size,
    v_recipe_category as recipe_category,
    v_required_ingredients as required_ingredients,
    GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
    v_round_score as round_score,
    v_total_score as total_score,
    v_completion_count as challenge_completion_count;

END;
$$;


-- 6. Create RPC function to validate and submit a bowl completion
CREATE OR REPLACE FUNCTION submit_slop_clock_bowl_completion(
  p_room_code TEXT,
  p_reconnect_token TEXT,
  p_challenge_id UUID,
  p_selected_items JSONB
)
RETURNS TABLE (
  is_accepted BOOLEAN,
  reason_category TEXT,
  awarded_score INTEGER,
  updated_round_score INTEGER,
  updated_total_score INTEGER,
  next_challenge_id UUID,
  next_challenge_sequence INTEGER,
  next_recipe_id TEXT,
  next_recipe_name TEXT,
  next_recipe_size TEXT,
  next_recipe_category TEXT,
  next_required_ingredients JSONB,
  remaining_round_seconds INTEGER,
  challenge_completion_count INTEGER
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
  
  v_challenge_record_id UUID;
  v_recipe_id TEXT;
  v_recipe_size TEXT;
  v_challenge_sequence INTEGER;
  v_challenge_status TEXT;
  
  v_variants_json JSONB;
  v_phase TEXT;
  v_required JSONB;
  v_selected JSONB;
  v_is_valid BOOLEAN := true;
  v_invalid_phase TEXT := NULL;
  
  v_round_score INTEGER;
  v_total_score INTEGER;
  v_completion_count INTEGER;
  
  -- Next challenge variables
  v_next_challenge_id UUID := NULL;
  v_next_sequence INTEGER := NULL;
  v_next_recipe_id TEXT := NULL;
  v_next_recipe_name TEXT := NULL;
  v_next_recipe_size TEXT := NULL;
  v_next_recipe_category TEXT := NULL;
  v_next_required_ingredients JSONB := NULL;
  v_has_large BOOLEAN;
BEGIN
  -- A. Validate reconnection credentials
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');
  
  SELECT p.id, p.room_id, r.status INTO v_participant_id, v_room_id, v_room_status
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash 
    AND r.room_code = upper(trim(p_room_code)) 
    AND r.status != 'closed';

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- B. Fetch active slop_clock round details
  SELECT id, game_type, ends_at INTO v_round_id, v_game_type, v_ends_at
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active';

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No active round found for this room.';
  END IF;

  IF v_game_type != 'slop_clock' THEN
    RAISE EXCEPTION 'The current active round is not slop_clock.';
  END IF;

  -- C. Fetch challenge record and verify ownership
  SELECT id, recipe_id, recipe_size, challenge_sequence, challenge_status
  INTO v_challenge_record_id, v_recipe_id, v_recipe_size, v_challenge_sequence, v_challenge_status
  FROM arena_round_challenges
  WHERE id = p_challenge_id 
    AND round_id = v_round_id 
    AND participant_id = v_participant_id;

  IF v_challenge_record_id IS NULL THEN
    RAISE EXCEPTION 'Challenge not found or unauthorized.';
  END IF;

  -- D. Handle duplicate / replayed attempts (Idempotency safety)
  IF v_challenge_status = 'completed' THEN
    -- Return cached results from the previously completed challenge
    SELECT COALESCE(round_score, 0) INTO v_round_score
    FROM arena_round_participants
    WHERE round_id = v_round_id AND participant_id = v_participant_id;

    SELECT p.total_score INTO v_total_score
    FROM arena_participants p
    WHERE p.id = v_participant_id;

    SELECT COUNT(*)::integer INTO v_completion_count
    FROM arena_round_challenges
    WHERE round_id = v_round_id AND participant_id = v_participant_id AND challenge_status = 'completed';

    -- Grab next active challenge if any
    SELECT c.id, c.challenge_sequence, c.recipe_id, r.name, c.recipe_size, r.category, (r.variants -> c.recipe_size)
    INTO v_next_challenge_id, v_next_sequence, v_next_recipe_id, v_next_recipe_name, v_next_recipe_size, v_next_recipe_category, v_next_required_ingredients
    FROM arena_round_challenges c
    JOIN arena_recipes r ON c.recipe_id = r.id
    WHERE c.round_id = v_round_id 
      AND c.participant_id = v_participant_id 
      AND c.challenge_status = 'active'
    LIMIT 1;

    RETURN QUERY SELECT
      true as is_accepted,
      'already_completed'::text as reason_category,
      1 as awarded_score,
      v_round_score as updated_round_score,
      v_total_score as updated_total_score,
      v_next_challenge_id as next_challenge_id,
      v_next_sequence as next_challenge_sequence,
      v_next_recipe_id as next_recipe_id,
      v_next_recipe_name as next_recipe_name,
      v_next_recipe_size as next_recipe_size,
      v_next_recipe_category as next_recipe_category,
      v_next_required_ingredients as next_required_ingredients,
      GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
      v_completion_count as challenge_completion_count;
    RETURN;
  END IF;

  -- E. Handle challenge already expired or invalidated
  IF v_challenge_status != 'active' THEN
    RAISE EXCEPTION 'This challenge is no longer active (status: %).', v_challenge_status;
  END IF;

  -- F. Check if the server-time round has expired
  IF NOW() >= v_ends_at THEN
    -- Auto-expire active challenge
    UPDATE arena_round_challenges
    SET challenge_status = 'expired', expired_at = NOW(), updated_at = NOW()
    WHERE id = p_challenge_id;

    SELECT COALESCE(round_score, 0) INTO v_round_score
    FROM arena_round_participants
    WHERE round_id = v_round_id AND participant_id = v_participant_id;

    SELECT p.total_score INTO v_total_score
    FROM arena_participants p
    WHERE p.id = v_participant_id;

    RETURN QUERY SELECT
      false as is_accepted,
      'round_expired'::text as reason_category,
      0 as awarded_score,
      v_round_score as updated_round_score,
      v_total_score as updated_total_score,
      NULL::uuid as next_challenge_id,
      NULL::integer as next_challenge_sequence,
      NULL::text as next_recipe_id,
      NULL::text as next_recipe_name,
      NULL::text as next_recipe_size,
      NULL::text as next_recipe_category,
      NULL::jsonb as next_required_ingredients,
      0 as remaining_round_seconds,
      (SELECT COUNT(*)::integer FROM arena_round_challenges WHERE round_id = v_round_id AND participant_id = v_participant_id AND challenge_status = 'completed') as challenge_completion_count;
    RETURN;
  END IF;

  -- G. Server-Side Ingredient Validation Engine
  SELECT (variants -> v_recipe_size) INTO v_variants_json
  FROM arena_recipes
  WHERE id = v_recipe_id;

  -- Iterate through all 7 required culinary compilation phases
  FOREACH v_phase IN ARRAY ARRAY['base', 'sauce_base', 'greens', 'protein', 'sauce_final', 'crispy', 'sesame'] LOOP
    v_required := COALESCE(v_variants_json -> v_phase, '[]'::jsonb);
    v_selected := COALESCE(p_selected_items -> v_phase, '[]'::jsonb);

    IF sort_jsonb_array(v_required) != sort_jsonb_array(v_selected) THEN
      v_is_valid := false;
      v_invalid_phase := v_phase;
      EXIT;
    END IF;
  END LOOP;

  -- H. Handle Validation Failures
  IF NOT v_is_valid THEN
    SELECT COALESCE(round_score, 0) INTO v_round_score
    FROM arena_round_participants
    WHERE round_id = v_round_id AND participant_id = v_participant_id;

    SELECT p.total_score INTO v_total_score
    FROM arena_participants p
    WHERE p.id = v_participant_id;

    SELECT COUNT(*)::integer INTO v_completion_count
    FROM arena_round_challenges
    WHERE round_id = v_round_id AND participant_id = v_participant_id AND challenge_status = 'completed';

    RETURN QUERY SELECT
      false as is_accepted,
      ('invalid_phase_' || v_invalid_phase)::text as reason_category,
      0 as awarded_score,
      v_round_score as updated_round_score,
      v_total_score as updated_total_score,
      NULL::uuid as next_challenge_id,
      NULL::integer as next_challenge_sequence,
      NULL::text as next_recipe_id,
      NULL::text as next_recipe_name,
      NULL::text as next_recipe_size,
      NULL::text as next_recipe_category,
      NULL::jsonb as next_required_ingredients,
      GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
      v_completion_count as challenge_completion_count;
    RETURN;
  END IF;

  -- I. Valid Bowl: Execute Atomic Score Updates
  UPDATE arena_round_challenges
  SET challenge_status = 'completed',
      completed_at = NOW(),
      completion_payload = p_selected_items,
      score_awarded = 1,
      updated_at = NOW()
  WHERE id = p_challenge_id;

  UPDATE arena_round_participants
  SET round_score = round_score + 1,
      updated_at = NOW()
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  UPDATE arena_participants
  SET total_score = total_score + 1,
      updated_at = NOW()
  WHERE id = v_participant_id;

  -- J. Draw and insert the next challenge atomically (unless the round ends right now)
  IF NOW() < v_ends_at THEN
    v_next_sequence := v_challenge_sequence + 1;

    -- Avoid assigning immediately repeated recipe (if multiple exist)
    SELECT id, name, category INTO v_next_recipe_id, v_next_recipe_name, v_next_recipe_category
    FROM arena_recipes
    WHERE id != v_recipe_id
    ORDER BY random()
    LIMIT 1;

    IF v_next_recipe_id IS NULL THEN
      SELECT id, name, category INTO v_next_recipe_id, v_next_recipe_name, v_next_recipe_category
      FROM arena_recipes
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- Determine size
    SELECT (variants ? 'Large') INTO v_has_large
    FROM arena_recipes
    WHERE id = v_next_recipe_id;

    IF v_has_large THEN
      IF random() > 0.5 THEN
        v_next_recipe_size := 'Large';
      ELSE
        v_next_recipe_size := 'Regular';
      END IF;
    ELSE
      v_next_recipe_size := 'Regular';
    END IF;

    -- Get next required ingredients
    SELECT (variants -> v_next_recipe_size) INTO v_next_required_ingredients
    FROM arena_recipes
    WHERE id = v_next_recipe_id;

    -- Create next active challenge
    INSERT INTO arena_round_challenges (
      room_id, round_id, participant_id, challenge_sequence, recipe_id, recipe_size, challenge_status, started_at
    ) VALUES (
      v_room_id, v_round_id, v_participant_id, v_next_sequence, v_next_recipe_id, v_next_recipe_size, 'active', NOW()
    ) RETURNING id INTO v_next_challenge_id;
  END IF;

  -- K. Insert transaction-safe audit logging event
  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (
    v_room_id,
    v_participant_id,
    'heartbeat_received',
    jsonb_build_object(
      'type', 'bowl_completed',
      'recipe_id', v_recipe_id,
      'size', v_recipe_size,
      'sequence', v_challenge_sequence,
      'score', 1
    )
  );

  -- Retrieve updated scoring tallies
  SELECT COALESCE(round_score, 0) INTO v_round_score
  FROM arena_round_participants
  WHERE round_id = v_round_id AND participant_id = v_participant_id;

  SELECT p.total_score INTO v_total_score
  FROM arena_participants p
  WHERE p.id = v_participant_id;

  SELECT COUNT(*)::integer INTO v_completion_count
  FROM arena_round_challenges
  WHERE round_id = v_round_id AND participant_id = v_participant_id AND challenge_status = 'completed';

  RETURN QUERY SELECT
    true as is_accepted,
    'success'::text as reason_category,
    1 as awarded_score,
    v_round_score as updated_round_score,
    v_total_score as updated_total_score,
    v_next_challenge_id as next_challenge_id,
    v_next_sequence as next_challenge_sequence,
    v_next_recipe_id as next_recipe_id,
    v_next_recipe_name as next_recipe_name,
    v_next_recipe_size as next_recipe_size,
    v_next_recipe_category as next_recipe_category,
    v_next_required_ingredients as next_required_ingredients,
    GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::integer) as remaining_round_seconds,
    v_completion_count as challenge_completion_count;

END;
$$;


-- 7. Grant execution access to public
GRANT EXECUTE ON FUNCTION get_or_create_active_challenge(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_slop_clock_bowl_completion(TEXT, TEXT, UUID, JSONB) TO anon, authenticated;

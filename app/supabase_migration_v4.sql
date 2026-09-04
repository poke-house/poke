-- Migration v4: House Arena Supabase Backend Foundation
-- Adds safe schema tables, constraints, indexes, triggers, views, RLS policies, and authoritative RPC functions.
-- Completely preserves existing Rush Mode tables, views, policies, and RPC functions.

-- 0. Enable pgcrypto extension if not already available for sha256 hashing and random bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. DATABASE TABLES & CONSTRAINTS
-- ============================================================================

-- Table A: arena_avatars (Lookup pool for unique player visual identities)
CREATE TABLE IF NOT EXISTS arena_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table B: arena_rooms (Room status container and authoritative timing master)
CREATE TABLE IF NOT EXISTS arena_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'lobby',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lobby_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lobby_ends_at TIMESTAMPTZ NOT NULL,
    tournament_started_at TIMESTAMPTZ,
    tournament_ended_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_round_number INTEGER NOT NULL DEFAULT 0,
    current_game_type TEXT,
    close_reason TEXT,
    created_by_participant_id UUID, -- Back-referenced once creator participant is generated
    
    -- Status validation check
    CONSTRAINT chk_arena_rooms_status CHECK (status IN ('lobby', 'starting', 'active', 'results', 'closed')),
    
    -- Close reason validation check
    CONSTRAINT chk_arena_rooms_close_reason CHECK (close_reason IN ('empty_lobby', 'insufficient_lobby_participants', 'inactive_timeout', 'manual_admin_close', 'system_error')),
    
    -- Game type validation check
    CONSTRAINT chk_arena_rooms_game_type CHECK (current_game_type IN ('slop_clock', 'quick_think', 'memory_match')),
    
    -- Timing integrity
    CONSTRAINT chk_arena_rooms_lobby_timing CHECK (lobby_ends_at > lobby_started_at),
    
    -- Code formatting: Uppercase alphanumeric, excluding confusing letters (O, I, 0, 1), length between 4 and 6
    CONSTRAINT chk_arena_rooms_code_format CHECK (room_code ~ '^[A-Z2-9]{4,6}$'),
    
    -- Closed room integrity
    CONSTRAINT chk_arena_rooms_closed_integrity_1 CHECK (closed_at IS NOT NULL OR status != 'closed'),
    CONSTRAINT chk_arena_rooms_closed_integrity_2 CHECK (closed_at IS NULL OR status = 'closed')
);

-- Table C: arena_participants (Temporary session profiles with hashed reconnection credentials)
CREATE TABLE IF NOT EXISTS arena_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    store_name TEXT NOT NULL,
    avatar_id UUID NOT NULL REFERENCES arena_avatars(id),
    reconnect_token_hash TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'joining',
    is_late_joiner BOOLEAN NOT NULL DEFAULT false,
    total_score INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique avatar assignment per room
    CONSTRAINT uq_arena_participants_avatar_per_room UNIQUE (room_id, avatar_id),
    
    -- Name trimmed constraints
    CONSTRAINT chk_arena_participants_display_name_trim CHECK (display_name = trim(regexp_replace(display_name, '\s+', ' ', 'g'))),
    CONSTRAINT chk_arena_participants_store_name_trim CHECK (store_name = trim(regexp_replace(store_name, '\s+', ' ', 'g'))),
    
    -- Name bounds
    CONSTRAINT chk_arena_participants_display_name_len CHECK (length(display_name) BETWEEN 2 AND 50),
    CONSTRAINT chk_arena_participants_store_name_len CHECK (length(store_name) BETWEEN 2 AND 80),
    
    -- Status validation check
    CONSTRAINT chk_arena_participants_status CHECK (status IN ('joining', 'lobby', 'playing', 'ranking', 'results', 'disconnected', 'left')),
    
    -- Left participant integrity
    CONSTRAINT chk_arena_participants_left_active CHECK (left_at IS NULL OR is_active = false),
    
    -- Non-negative scores
    CONSTRAINT chk_arena_participants_score CHECK (total_score >= 0)
);

-- Table D: arena_rounds (Synchronized gameplay rounds within active rooms)
CREATE TABLE IF NOT EXISTS arena_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Unique round number per room
    CONSTRAINT uq_arena_rounds_number UNIQUE (room_id, round_number),
    
    -- Status validation
    CONSTRAINT chk_arena_rounds_status CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    
    -- Timing integrity
    CONSTRAINT chk_arena_rounds_timing CHECK (starts_at < ends_at),
    
    -- Completion integrity
    CONSTRAINT chk_arena_rounds_completion_integrity_1 CHECK (completed_at IS NOT NULL OR status NOT IN ('completed', 'cancelled')),
    CONSTRAINT chk_arena_rounds_completion_integrity_2 CHECK (completed_at IS NULL OR status IN ('completed', 'cancelled'))
);

-- Enforce single active round per room
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_active_round_per_room 
ON arena_rounds(room_id) 
WHERE status = 'active';

-- Table E: arena_round_participants (Scores and entry status per player, per round)
CREATE TABLE IF NOT EXISTS arena_round_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_late BOOLEAN NOT NULL DEFAULT false,
    round_start_score INTEGER NOT NULL DEFAULT 0,
    round_end_score INTEGER,
    round_score INTEGER NOT NULL DEFAULT 0,
    is_eligible_for_round_ranking BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique record per participant per round
    CONSTRAINT uq_arena_round_participants_unique UNIQUE (round_id, participant_id),
    
    -- Non-negative scores
    CONSTRAINT chk_arena_round_participants_round_score CHECK (round_score >= 0),
    CONSTRAINT chk_arena_round_participants_start_score CHECK (round_start_score >= 0),
    CONSTRAINT chk_arena_round_participants_end_score CHECK (round_end_score IS NULL OR round_end_score >= 0),
    
    -- Status validation
    CONSTRAINT chk_arena_round_participants_status CHECK (status IN ('active', 'completed', 'disconnected', 'excluded'))
);

-- Table F: arena_presence (Authoritative heartbeat session states)
CREATE TABLE IF NOT EXISTS arena_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES arena_participants(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One presence slot per participant per room
    CONSTRAINT uq_arena_presence_participant UNIQUE (room_id, participant_id),
    
    -- Validations
    CONSTRAINT chk_arena_presence_status CHECK (status IN ('lobby', 'playing', 'ranking', 'results', 'disconnected', 'left')),
    CONSTRAINT chk_arena_presence_source CHECK (source IN ('browser', 'reconnect', 'server'))
);

-- Table G: arena_events (Append-only transactional debug and event logs)
CREATE TABLE IF NOT EXISTS arena_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES arena_rooms(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES arena_participants(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Allowed audit events
    CONSTRAINT chk_arena_events_type CHECK (event_type IN (
        'room_created', 'participant_joined', 'participant_reconnected', 
        'participant_left', 'heartbeat_received', 'lobby_expired', 
        'tournament_started', 'round_started', 'round_completed', 
        'tournament_completed', 'room_closed', 'late_joiner_entered'
    ))
);


-- ============================================================================
-- 2. PERFORMANCE INDEXES
-- ============================================================================

-- arena_rooms performance indexes
CREATE INDEX IF NOT EXISTS idx_arena_rooms_code ON arena_rooms(room_code) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_arena_rooms_status ON arena_rooms(status);
CREATE INDEX IF NOT EXISTS idx_arena_rooms_lobby_ends ON arena_rooms(lobby_ends_at) WHERE status = 'lobby';
CREATE INDEX IF NOT EXISTS idx_arena_rooms_activity ON arena_rooms(last_activity_at);

-- arena_participants performance indexes
CREATE INDEX IF NOT EXISTS idx_arena_participants_room ON arena_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_arena_participants_room_active ON arena_participants(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_arena_participants_room_last_seen ON arena_participants(room_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_arena_participants_token ON arena_participants(reconnect_token_hash);

-- arena_rounds performance indexes
CREATE INDEX IF NOT EXISTS idx_arena_rounds_room_round ON arena_rounds(room_id, round_number);
CREATE INDEX IF NOT EXISTS idx_arena_rounds_room_status ON arena_rounds(room_id, status);
CREATE INDEX IF NOT EXISTS idx_arena_rounds_bounds ON arena_rounds(starts_at, ends_at);

-- arena_round_participants performance indexes
CREATE INDEX IF NOT EXISTS idx_arena_round_participants_round ON arena_round_participants(round_id);
CREATE INDEX IF NOT EXISTS idx_arena_round_participants_part ON arena_round_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_round_participants_room_part ON arena_round_participants(room_id, participant_id);

-- arena_presence performance indexes
CREATE INDEX IF NOT EXISTS idx_arena_presence_room ON arena_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_arena_presence_part ON arena_presence(participant_id);
CREATE INDEX IF NOT EXISTS idx_arena_presence_last_seen ON arena_presence(last_seen_at);

-- arena_events performance indexes
CREATE INDEX IF NOT EXISTS idx_arena_events_room_created ON arena_events(room_id, created_at);


-- ============================================================================
-- 3. TRIGGERS & SECURITY AUDITS
-- ============================================================================

-- A. Idempotent timestamp updater function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- B. Assign timestamp triggers
CREATE TRIGGER trg_arena_participants_updated_at
BEFORE UPDATE ON arena_participants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_arena_round_participants_updated_at
BEFORE UPDATE ON arena_round_participants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_arena_presence_updated_at
BEFORE UPDATE ON arena_presence
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- C. Enforce rounds cannot be created or altered in a closed room
CREATE OR REPLACE FUNCTION check_room_not_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT status FROM arena_rooms WHERE id = NEW.room_id) = 'closed' THEN
    RAISE EXCEPTION 'Cannot create, modify or delete rounds in a closed room.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_arena_rounds_room_closed_check
BEFORE INSERT OR UPDATE ON arena_rounds
FOR EACH ROW EXECUTE FUNCTION check_room_not_closed();

-- D. Append-only event logs safeguard trigger
CREATE OR REPLACE FUNCTION prevent_modify_events()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'arena_events is an append-only log. Updates and deletes are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_modify_events
BEFORE UPDATE OR DELETE ON arena_events
FOR EACH STATEMENT EXECUTE FUNCTION prevent_modify_events();


-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE arena_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_round_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_events ENABLE ROW LEVEL SECURITY;

-- Note: No anonymous direct WRITE access policies (INSERT, UPDATE, DELETE) are created.
-- All database updates must occur safely through the SECURITY DEFINER RPC functions.

-- Read access policies
CREATE POLICY "Allow public read active avatars" ON arena_avatars
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read rooms" ON arena_rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow public read participants" ON arena_participants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read rounds" ON arena_rounds
  FOR SELECT USING (true);

CREATE POLICY "Allow public read round participants" ON arena_round_participants
  FOR SELECT USING (true);

CREATE POLICY "Allow public read presence" ON arena_presence
  FOR SELECT USING (true);

-- No direct read policy for arena_events. They are secured for backend auditing only.


-- ============================================================================
-- 5. SAFE PUBLIC READ VIEWS
-- ============================================================================

-- View A: vw_arena_room_public (Filters sensitive details, computes dynamic countdowns and joinability)
CREATE OR REPLACE VIEW vw_arena_room_public AS
SELECT 
  id,
  room_code,
  status,
  lobby_ends_at,
  current_round_number,
  current_game_type,
  (SELECT COUNT(*)::integer FROM arena_participants p WHERE p.room_id = r.id AND p.is_active = true) as active_participant_count,
  (status = 'lobby' AND (SELECT COUNT(*) FROM arena_participants p WHERE p.room_id = r.id AND p.is_active = true) < 8) as is_joinable
FROM arena_rooms r;

-- View B: vw_arena_room_leaderboard (Outputs safe deterministic ranking lists)
-- Tie breaking criteria:
--   1st: Higher total_score
--   2nd: Earlier joined_at
--   3rd: Deterministic participant uuid ascending
CREATE OR REPLACE VIEW vw_arena_room_leaderboard AS
SELECT 
  r.room_code,
  p.display_name as participant_display_name,
  p.store_name as participant_store_name,
  a.asset_key as avatar_asset_key,
  p.total_score,
  ROW_NUMBER() OVER (
    PARTITION BY p.room_id
    ORDER BY p.total_score DESC, p.joined_at ASC, p.id ASC
  ) as rank,
  (ROW_NUMBER() OVER (
    PARTITION BY p.room_id
    ORDER BY p.total_score DESC, p.joined_at ASC, p.id ASC
  ) = 1 AND r.status = 'results') as is_champion
FROM arena_participants p
JOIN arena_rooms r ON p.room_id = r.id
JOIN arena_avatars a ON p.avatar_id = a.id
WHERE p.is_active = true;

-- Grant SELECT access on safe views to anonymous and authenticated users
GRANT SELECT ON TABLE vw_arena_room_public TO anon, authenticated;
GRANT SELECT ON TABLE vw_arena_room_leaderboard TO anon, authenticated;


-- ============================================================================
-- 6. TRANSACTION-SAFE RPC FUNCTIONS
-- ============================================================================

-- RPC A: create_arena_room (Atomic room creation and host enrollment)
CREATE OR REPLACE FUNCTION create_arena_room(
  p_display_name TEXT,
  p_store_name TEXT
)
RETURNS TABLE (
  room_code TEXT,
  room_status TEXT,
  lobby_ends_at TIMESTAMPTZ,
  participant_id UUID,
  avatar_asset_key TEXT,
  reconnect_token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_code TEXT;
  v_room_id UUID;
  v_participant_id UUID;
  v_reconnect_token TEXT;
  v_reconnect_token_hash TEXT;
  v_avatar_id UUID;
  v_avatar_asset_key TEXT;
  v_lobby_ends TIMESTAMPTZ;
  v_trimmed_name TEXT;
  v_trimmed_store TEXT;
BEGIN
  -- 1. Trimming and validation
  v_trimmed_name := trim(regexp_replace(p_display_name, '\s+', ' ', 'g'));
  v_trimmed_store := trim(regexp_replace(p_store_name, '\s+', ' ', 'g'));

  IF length(v_trimmed_name) < 2 OR length(v_trimmed_name) > 50 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 50 characters.';
  END IF;
  IF length(v_trimmed_store) < 2 OR length(v_trimmed_store) > 80 THEN
    RAISE EXCEPTION 'Store name must be between 2 and 80 characters.';
  END IF;

  -- 2. Generate unique uppercase alphanumeric room code, excluding O, I, 0, 1
  LOOP
    v_room_code := '';
    FOR i IN 1..5 LOOP
      v_room_code := v_room_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM arena_rooms WHERE room_code = v_room_code AND status != 'closed') THEN
      EXIT;
    END IF;
  END LOOP;

  -- 3. Generate reconnect credentials and hashes
  v_reconnect_token := encode(gen_random_bytes(16), 'hex');
  v_reconnect_token_hash := encode(digest(v_reconnect_token, 'sha256'), 'hex');

  -- 4. Atomically select any active avatar at random to bootstrap host setup
  SELECT id, asset_key INTO v_avatar_id, v_avatar_asset_key
  FROM arena_avatars
  WHERE is_active = true
  ORDER BY random()
  LIMIT 1;

  IF v_avatar_id IS NULL THEN
    RAISE EXCEPTION 'No active avatars are registered in the pool.';
  END IF;

  v_lobby_ends := NOW() + INTERVAL '5 minutes';

  -- 5. Create room row
  INSERT INTO arena_rooms (
    room_code,
    status,
    lobby_ends_at
  )
  VALUES (
    v_room_code,
    'lobby',
    v_lobby_ends
  )
  RETURNING id INTO v_room_id;

  -- 6. Insert host participant
  INSERT INTO arena_participants (
    room_id,
    display_name,
    store_name,
    avatar_id,
    reconnect_token_hash,
    status,
    is_host,
    is_active
  )
  VALUES (
    v_room_id,
    v_trimmed_name,
    v_trimmed_store,
    v_avatar_id,
    v_reconnect_token_hash,
    'lobby',
    true,
    true
  )
  RETURNING id INTO v_participant_id;

  -- 7. Back-reference room creator
  UPDATE arena_rooms SET created_by_participant_id = v_participant_id WHERE id = v_room_id;

  -- 8. Transactional events
  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (v_room_id, v_participant_id, 'room_created', jsonb_build_object('room_code', v_room_code, 'lobby_ends_at', v_lobby_ends));

  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (v_room_id, v_participant_id, 'participant_joined', jsonb_build_object('display_name', v_trimmed_name, 'avatar_asset_key', v_avatar_asset_key, 'is_host', true));

  -- 9. Initialize presence
  INSERT INTO arena_presence (room_id, participant_id, status, source)
  VALUES (v_room_id, v_participant_id, 'lobby', 'server');

  RETURN QUERY SELECT 
    v_room_code as room_code,
    'lobby'::text as room_status,
    v_lobby_ends as lobby_ends_at,
    v_participant_id as participant_id,
    v_avatar_asset_key as avatar_asset_key,
    v_reconnect_token as reconnect_token;
END;
$$;


-- RPC B: join_arena_room (Atomic player registry and unique avatar allocation)
CREATE OR REPLACE FUNCTION join_arena_room(
  p_room_code TEXT,
  p_display_name TEXT,
  p_store_name TEXT
)
RETURNS TABLE (
  room_id UUID,
  room_status TEXT,
  participant_id UUID,
  avatar_asset_key TEXT,
  reconnect_token TEXT,
  is_late_joiner BOOLEAN,
  current_round_number INTEGER,
  current_game_type TEXT,
  remaining_round_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_code TEXT;
  v_room_id UUID;
  v_room_status TEXT;
  v_lobby_ends TIMESTAMPTZ;
  v_current_round INTEGER;
  v_game_type TEXT;
  
  v_participant_id UUID;
  v_reconnect_token TEXT;
  v_reconnect_token_hash TEXT;
  v_avatar_id UUID;
  v_avatar_asset_key TEXT;
  v_is_late BOOLEAN;
  
  v_round_id UUID;
  v_round_ends TIMESTAMPTZ;
  v_remaining_seconds INTEGER := 0;
  
  v_trimmed_name TEXT;
  v_trimmed_store TEXT;
BEGIN
  -- 1. Formatting and verification
  v_room_code := upper(trim(p_room_code));
  v_trimmed_name := trim(regexp_replace(p_display_name, '\s+', ' ', 'g'));
  v_trimmed_store := trim(regexp_replace(p_store_name, '\s+', ' ', 'g'));

  IF length(v_trimmed_name) < 2 OR length(v_trimmed_name) > 50 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 50 characters.';
  END IF;
  IF length(v_trimmed_store) < 2 OR length(v_trimmed_store) > 80 THEN
    RAISE EXCEPTION 'Store name must be between 2 and 80 characters.';
  END IF;

  -- 2. Retrieve room
  SELECT id, status, lobby_ends_at, current_round_number, current_game_type
  INTO v_room_id, v_room_status, v_lobby_ends, v_current_round, v_game_type
  FROM arena_rooms
  WHERE room_code = v_room_code
  LIMIT 1;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room code % not found.', p_room_code;
  END IF;
  
  IF v_room_status = 'closed' THEN
    RAISE EXCEPTION 'This room is closed.';
  END IF;

  -- 3. Determine Late Joiner state (any registration past the lobby phase)
  v_is_late := (v_room_status != 'lobby');

  -- 4. Select a random unused active avatar atomically within the targeted room
  SELECT id, asset_key INTO v_avatar_id, v_avatar_asset_key
  FROM arena_avatars
  WHERE is_active = true
    AND id NOT IN (
      SELECT avatar_id FROM arena_participants WHERE room_id = v_room_id AND is_active = true
    )
  ORDER BY random()
  LIMIT 1;

  IF v_avatar_id IS NULL THEN
    RAISE EXCEPTION 'No avatars available. This room has reached its maximum capacity of 8 players.';
  END IF;

  -- 5. Generate secure hashes
  v_reconnect_token := encode(gen_random_bytes(16), 'hex');
  v_reconnect_token_hash := encode(digest(v_reconnect_token, 'sha256'), 'hex');

  -- 6. Insert new participant row
  INSERT INTO arena_participants (
    room_id,
    display_name,
    store_name,
    avatar_id,
    reconnect_token_hash,
    status,
    is_late_joiner,
    is_active
  )
  VALUES (
    v_room_id,
    v_trimmed_name,
    v_trimmed_store,
    v_avatar_id,
    v_reconnect_token_hash,
    CASE WHEN v_is_late THEN 'playing' ELSE 'lobby' END,
    v_is_late,
    true
  )
  RETURNING id INTO v_participant_id;

  -- 7. Initialize presence
  INSERT INTO arena_presence (room_id, participant_id, status, source)
  VALUES (v_room_id, v_participant_id, CASE WHEN v_is_late THEN 'playing' ELSE 'lobby' END, 'server');

  -- 8. Transaction events
  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (v_room_id, v_participant_id, 'participant_joined', jsonb_build_object('display_name', v_trimmed_name, 'avatar_asset_key', v_avatar_asset_key, 'is_host', false));

  IF v_is_late THEN
    INSERT INTO arena_events (room_id, participant_id, event_type, payload)
    VALUES (v_room_id, v_participant_id, 'late_joiner_entered', jsonb_build_object('display_name', v_trimmed_name));
    
    -- Check for ongoing active round to calculate and insert them into the active round
    SELECT id, ends_at INTO v_round_id, v_round_ends
    FROM arena_rounds
    WHERE room_id = v_room_id AND status = 'active'
    LIMIT 1;
    
    IF v_round_id IS NOT NULL THEN
      INSERT INTO arena_round_participants (
        room_id, round_id, participant_id, joined_late, round_start_score, round_score, status
      )
      VALUES (
        v_room_id, v_round_id, v_participant_id, true, 0, 0, 'active'
      );
      v_remaining_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_round_ends - NOW()))::integer);
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_room_id as room_id,
    v_room_status as room_status,
    v_participant_id as participant_id,
    v_avatar_asset_key as avatar_asset_key,
    v_reconnect_token as reconnect_token,
    v_is_late as is_late_joiner,
    v_current_round as current_round_number,
    v_game_type as current_game_type,
    v_remaining_seconds as remaining_round_seconds;
END;
$$;


-- RPC C: reconnect_arena_participant (Recovers existing player profiles and restores active heartbeats)
CREATE OR REPLACE FUNCTION reconnect_arena_participant(
  p_room_code TEXT,
  p_reconnect_token TEXT
)
RETURNS TABLE (
  room_id UUID,
  room_status TEXT,
  participant_id UUID,
  display_name TEXT,
  store_name TEXT,
  avatar_asset_key TEXT,
  is_late_joiner BOOLEAN,
  current_round_number INTEGER,
  current_game_type TEXT,
  remaining_round_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_room_id UUID;
  v_room_status TEXT;
  v_current_round INTEGER;
  v_game_type TEXT;
  v_participant_id UUID;
  v_display_name TEXT;
  v_store_name TEXT;
  v_avatar_asset_key TEXT;
  v_is_late BOOLEAN;
  v_round_ends TIMESTAMPTZ;
  v_remaining_seconds INTEGER := 0;
BEGIN
  -- 1. Compute secure token hash
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');

  -- 2. Resolve credentials
  SELECT p.id, p.display_name, p.store_name, p.room_id, p.is_late_joiner, r.status, r.current_round_number, r.current_game_type, a.asset_key
  INTO v_participant_id, v_display_name, v_store_name, v_room_id, v_is_late, v_room_status, v_current_round, v_game_type, v_avatar_asset_key
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  JOIN arena_avatars a ON p.avatar_id = a.id
  WHERE p.reconnect_token_hash = v_hash
    AND r.room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Invalid reconnection credentials or room code.';
  END IF;

  IF v_room_status = 'closed' THEN
    RAISE EXCEPTION 'Reconnection failed: This room is closed.';
  END IF;

  -- 3. Restore active states
  UPDATE arena_participants
  SET is_active = true,
      last_seen_at = NOW(),
      status = CASE WHEN v_room_status = 'lobby' THEN 'lobby' ELSE 'playing' END
  WHERE id = v_participant_id;

  -- 4. Re-establish presence
  INSERT INTO arena_presence (room_id, participant_id, status, source, last_seen_at)
  VALUES (v_room_id, v_participant_id, CASE WHEN v_room_status = 'lobby' THEN 'lobby' ELSE 'playing' END, 'reconnect', NOW())
  ON CONFLICT (room_id, participant_id) DO UPDATE
  SET status = EXCLUDED.status, source = EXCLUDED.source, last_seen_at = EXCLUDED.last_seen_at;

  -- 5. Audit event logs
  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (v_room_id, v_participant_id, 'participant_reconnected', jsonb_build_object('display_name', v_display_name));

  -- 6. Check for active rounds
  SELECT ends_at INTO v_round_ends
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active'
  LIMIT 1;

  IF v_round_ends IS NOT NULL THEN
    v_remaining_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_round_ends - NOW()))::integer);
  END IF;

  RETURN QUERY SELECT
    v_room_id as room_id,
    v_room_status as room_status,
    v_participant_id as participant_id,
    v_display_name as display_name,
    v_store_name as store_name,
    v_avatar_asset_key as avatar_asset_key,
    v_is_late as is_late_joiner,
    v_current_round as current_round_number,
    v_game_type as current_game_type,
    v_remaining_seconds as remaining_round_seconds;
END;
$$;


-- RPC D: arena_heartbeat (Pings presence and documents continuous player interaction)
CREATE OR REPLACE FUNCTION arena_heartbeat(
  p_room_code TEXT,
  p_reconnect_token TEXT,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_participant_id UUID;
  v_room_id UUID;
BEGIN
  -- 1. Status limits
  IF p_status NOT IN ('lobby', 'playing', 'ranking', 'results') THEN
    RAISE EXCEPTION 'Invalid state parameter: %', p_status;
  END IF;

  -- 2. Authenticate
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');

  SELECT p.id, p.room_id INTO v_participant_id, v_room_id
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash
    AND r.room_code = upper(trim(p_room_code))
    AND r.status != 'closed'
  LIMIT 1;

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Reconnection token or room code mismatch.';
  END IF;

  -- 3. Update participant timestamps
  UPDATE arena_participants
  SET last_seen_at = NOW(),
      is_active = true
  WHERE id = v_participant_id;

  -- 4. Record room-wide activity tracking to delay inactive auto-close sweeps
  UPDATE arena_rooms
  SET last_activity_at = NOW()
  WHERE id = v_room_id;

  -- 5. Upsert presence row
  INSERT INTO arena_presence (room_id, participant_id, status, source, last_seen_at)
  VALUES (v_room_id, v_participant_id, p_status, 'browser', NOW())
  ON CONFLICT (room_id, participant_id) DO UPDATE
  SET status = EXCLUDED.status, source = EXCLUDED.source, last_seen_at = EXCLUDED.last_seen_at;

  RETURN true;
END;
$$;


-- RPC E: get_arena_room_public_state (Query current room details securely)
CREATE OR REPLACE FUNCTION get_arena_room_public_state(
  p_room_code TEXT
)
RETURNS TABLE (
  room_code TEXT,
  status TEXT,
  lobby_countdown_seconds INTEGER,
  active_participant_count INTEGER,
  current_round_number INTEGER,
  current_game_type TEXT,
  remaining_round_seconds INTEGER,
  is_joinable BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_status TEXT;
  v_lobby_ends TIMESTAMPTZ;
  v_current_round INTEGER;
  v_game_type TEXT;
  v_active_count INTEGER;
  v_lobby_countdown INTEGER := 0;
  v_round_ends TIMESTAMPTZ;
  v_round_countdown INTEGER := 0;
  v_joinable BOOLEAN;
BEGIN
  -- 1. Query base details
  SELECT id, status, lobby_ends_at, current_round_number, current_game_type, is_joinable
  INTO v_room_id, v_status, v_lobby_ends, v_current_round, v_game_type, v_joinable
  FROM vw_arena_room_public
  WHERE room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF v_room_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Count active players
  SELECT COUNT(*)::integer INTO v_active_count
  FROM arena_participants
  WHERE room_id = v_room_id AND is_active = true;

  -- 3. Lobby countdown calculation
  IF v_status = 'lobby' THEN
    v_lobby_countdown := GREATEST(0, EXTRACT(EPOCH FROM (v_lobby_ends - NOW()))::integer);
  END IF;

  -- 4. Round countdown calculation
  SELECT ends_at INTO v_round_ends
  FROM arena_rounds
  WHERE room_id = v_room_id AND status = 'active'
  LIMIT 1;

  IF v_round_ends IS NOT NULL THEN
    v_round_countdown := GREATEST(0, EXTRACT(EPOCH FROM (v_round_ends - NOW()))::integer);
  END IF;

  RETURN QUERY SELECT
    upper(trim(p_room_code)) as room_code,
    v_status as status,
    v_lobby_countdown as lobby_countdown_seconds,
    v_active_count as active_participant_count,
    v_current_round as current_round_number,
    v_game_type as current_game_type,
    v_round_countdown as remaining_round_seconds,
    v_joinable as is_joinable;
END;
$$;


-- RPC F: get_arena_room_leaderboard (Retrieves leaderboard entries using view)
CREATE OR REPLACE FUNCTION get_arena_room_leaderboard(
  p_room_code TEXT
)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  store_name TEXT,
  avatar_asset_key TEXT,
  total_score INTEGER,
  is_champion BOOLEAN,
  room_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.rank,
    v.participant_display_name as display_name,
    v.participant_store_name as store_name,
    v.avatar_asset_key,
    v.total_score,
    v.is_champion,
    r.status as room_status
  FROM vw_arena_room_leaderboard v
  JOIN arena_rooms r ON r.room_code = v.room_code
  WHERE r.room_code = upper(trim(p_room_code))
  ORDER BY v.rank ASC;
END;
$$;


-- ============================================================================
-- 7. SERVER-CONTROLLED LIFECYCLE & ENGINE INTERNALS
-- ============================================================================

-- A. Lobby Expirations Processor
-- Runs server-side. Evaluates rooms stuck in 'lobby' that exceeded their 5-minute timer.
-- Disbands rooms with < 2 participants, else automatically launches tournament.
CREATE OR REPLACE FUNCTION process_arena_lobby_expirations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_active_players INTEGER;
BEGIN
  -- 1. Sweep participants that haven't sent heartbeats in 60 seconds
  UPDATE arena_participants
  SET is_active = false, status = 'disconnected'
  WHERE is_active = true AND last_seen_at < NOW() - INTERVAL '60 seconds';

  -- 2. Check each expired lobby
  FOR r IN 
    SELECT id, room_code FROM arena_rooms 
    WHERE status = 'lobby' AND lobby_ends_at <= NOW()
  LOOP
    SELECT COUNT(*)::integer INTO v_active_players
    FROM arena_participants
    WHERE room_id = r.id AND is_active = true;

    IF v_active_players < 2 THEN
      -- Disband/Close
      UPDATE arena_rooms
      SET status = 'closed',
          closed_at = NOW(),
          close_reason = CASE WHEN v_active_players = 0 THEN 'empty_lobby' ELSE 'insufficient_lobby_participants' END
      WHERE id = r.id;

      INSERT INTO arena_events (room_id, event_type, payload)
      VALUES (r.id, 'room_closed', jsonb_build_object('reason', CASE WHEN v_active_players = 0 THEN 'empty_lobby' ELSE 'insufficient_lobby_participants' END, 'active_players', v_active_players));
    ELSE
      -- Start tournament transition sequence
      UPDATE arena_rooms
      SET status = 'starting'
      WHERE id = r.id;

      INSERT INTO arena_events (room_id, event_type, payload)
      VALUES (r.id, 'tournament_started', jsonb_build_object('active_players', v_active_players));
      
      -- Automatically trigger start logic
      PERFORM start_arena_tournament_if_eligible(r.id);
    END IF;
  END LOOP;
END;
$$;


-- B. Inactive Rooms Processor
-- Clean up rooms with 0 heartbeats active for more than 10 consecutive minutes.
CREATE OR REPLACE FUNCTION process_arena_inactive_rooms()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_active_players INTEGER;
BEGIN
  -- 1. First sweep participants that haven't sent heartbeats in 60 seconds
  UPDATE arena_participants
  SET is_active = false, status = 'disconnected'
  WHERE is_active = true AND last_seen_at < NOW() - INTERVAL '60 seconds';

  -- 2. Sweep inactive rooms
  FOR r IN 
    SELECT id, room_code, status, last_activity_at 
    FROM arena_rooms 
    WHERE status != 'closed'
  LOOP
    SELECT COUNT(*)::integer INTO v_active_players
    FROM arena_participants
    WHERE room_id = r.id AND is_active = true;

    IF v_active_players = 0 AND r.last_activity_at < NOW() - INTERVAL '10 minutes' THEN
      UPDATE arena_rooms
      SET status = 'closed',
          closed_at = NOW(),
          close_reason = 'inactive_timeout'
      WHERE id = r.id;

      INSERT INTO arena_events (room_id, event_type, payload)
      VALUES (r.id, 'room_closed', jsonb_build_object('reason', 'inactive_timeout'));
    END IF;
  END LOOP;
END;
$$;


-- C. start_arena_tournament_if_eligible (Launches tournament, sets round 1, game type)
CREATE OR REPLACE FUNCTION start_arena_tournament_if_eligible(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_players INTEGER;
  v_status TEXT;
  v_round_id UUID;
BEGIN
  SELECT status INTO v_status FROM arena_rooms WHERE id = p_room_id;
  IF v_status NOT IN ('lobby', 'starting') THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)::integer INTO v_active_players
  FROM arena_participants
  WHERE room_id = p_room_id AND is_active = true;

  IF v_active_players >= 2 THEN
    -- Transition room status
    UPDATE arena_rooms
    SET status = 'active',
        tournament_started_at = NOW(),
        current_round_number = 1,
        current_game_type = 'slop_clock'
    WHERE id = p_room_id;

    -- Create round 1
    INSERT INTO arena_rounds (room_id, round_number, game_type, status, starts_at, ends_at)
    VALUES (p_room_id, 1, 'slop_clock', 'active', NOW(), NOW() + INTERVAL '60 seconds')
    RETURNING id INTO v_round_id;

    -- Set active participant states to playing
    UPDATE arena_participants
    SET status = 'playing'
    WHERE room_id = p_room_id AND is_active = true;

    -- Create round participant mapping
    INSERT INTO arena_round_participants (room_id, round_id, participant_id, joined_late, round_start_score, round_score, status)
    SELECT p_room_id, v_round_id, id, false, 0, 0, 'active'
    FROM arena_participants
    WHERE room_id = p_room_id AND is_active = true;

    INSERT INTO arena_events (room_id, event_type, payload)
    VALUES (p_room_id, 'round_started', jsonb_build_object('round_number', 1, 'game_type', 'slop_clock'));

    RETURN true;
  ELSE
    -- Revert/Close
    UPDATE arena_rooms
    SET status = 'closed',
        closed_at = NOW(),
        close_reason = 'insufficient_lobby_participants'
    WHERE id = p_room_id;

    INSERT INTO arena_events (room_id, event_type, payload)
    VALUES (p_room_id, 'room_closed', jsonb_build_object('reason', 'insufficient_lobby_participants'));

    RETURN false;
  END IF;
END;
$$;


-- D. start_arena_round (Launches customized rounds, manages timings)
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
BEGIN
  SELECT status INTO v_status FROM arena_rooms WHERE id = p_room_id;
  IF v_status != 'active' THEN
    RAISE EXCEPTION 'Action Denied: Tournament is not in an active state.';
  END IF;

  IF p_game_type NOT IN ('slop_clock', 'quick_think', 'memory_match') THEN
    RAISE EXCEPTION 'Invalid Game type selected: %', p_game_type;
  END IF;

  -- Complete previous rounds
  UPDATE arena_rounds
  SET status = 'completed', completed_at = NOW()
  WHERE room_id = p_room_id AND status = 'active';

  -- Create round
  INSERT INTO arena_rounds (room_id, round_number, game_type, status, starts_at, ends_at)
  VALUES (p_room_id, p_round_number, p_game_type, 'active', NOW(), NOW() + INTERVAL '60 seconds')
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


-- E. complete_arena_round (Closes a round and applies scores authoritative-only)
CREATE OR REPLACE FUNCTION complete_arena_round(p_round_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_round_number INTEGER;
  r RECORD;
BEGIN
  UPDATE arena_rounds
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_round_id AND status = 'active'
  RETURNING room_id, round_number INTO v_room_id, v_round_number;

  IF v_room_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE arena_round_participants
  SET status = 'completed'
  WHERE round_id = p_round_id AND status = 'active';

  -- Accumulate round scores to main totals
  FOR r IN 
    SELECT participant_id, round_score 
    FROM arena_round_participants 
    WHERE round_id = p_round_id
  LOOP
    UPDATE arena_participants
    SET total_score = total_score + r.round_score
    WHERE id = r.participant_id;
  END LOOP;

  -- Shift active participants to ranking review phase
  UPDATE arena_participants
  SET status = 'ranking'
  WHERE room_id = v_room_id AND is_active = true;

  INSERT INTO arena_events (room_id, event_type, payload)
  VALUES (v_room_id, 'round_completed', jsonb_build_object('round_id', p_round_id, 'round_number', v_round_number));

  RETURN true;
END;
$$;


-- F. complete_arena_tournament (Transition room to results screen, marks champion)
CREATE OR REPLACE FUNCTION complete_arena_tournament(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_champion_name TEXT;
  v_champion_score INTEGER;
BEGIN
  SELECT status INTO v_status FROM arena_rooms WHERE id = p_room_id;
  IF v_status != 'active' THEN
    RETURN false;
  END IF;

  -- Complete any active round remaining
  UPDATE arena_rounds
  SET status = 'completed', completed_at = NOW()
  WHERE room_id = p_room_id AND status = 'active';

  -- Set room status to results
  UPDATE arena_rooms
  SET status = 'results',
      tournament_ended_at = NOW()
  WHERE id = p_room_id;

  -- Shift active participants to results screen
  UPDATE arena_participants
  SET status = 'results'
  WHERE room_id = p_room_id AND is_active = true;

  -- Identify final champion
  SELECT display_name, total_score INTO v_champion_name, v_champion_score
  FROM arena_participants
  WHERE room_id = p_room_id AND is_active = true
  ORDER BY total_score DESC, joined_at ASC, id ASC
  LIMIT 1;

  INSERT INTO arena_events (room_id, event_type, payload)
  VALUES (p_room_id, 'tournament_completed', jsonb_build_object('champion', v_champion_name, 'score', v_champion_score));

  RETURN true;
END;
$$;


-- Revoke public, anonymous and user execute capabilities on all internal engine functions
-- to ensure they are strictly controlled from the trusted backend agent / background cron triggers.
REVOKE EXECUTE ON FUNCTION process_arena_lobby_expirations() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION process_arena_inactive_rooms() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION start_arena_tournament_if_eligible(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION start_arena_round(UUID, INTEGER, TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION complete_arena_round(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION complete_arena_tournament(UUID) FROM public, anon, authenticated;

-- Grant EXECUTE permissions to safe client operations
GRANT EXECUTE ON FUNCTION create_arena_room(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_arena_room(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reconnect_arena_participant(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION arena_heartbeat(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_arena_room_public_state(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_arena_room_leaderboard(TEXT) TO anon, authenticated;


-- ============================================================================
-- 8. LOOKUP DATA SEEDING (AVATARS POOL)
-- ============================================================================

INSERT INTO arena_avatars (id, asset_key, label, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'avatar_mochi_ninja', 'Pink Mochi Ninja', true),
  ('a2222222-2222-2222-2222-222222222222', 'avatar_salmon_shogun', 'Salmon Shogun', true),
  ('a3333333-3333-3333-3333-333333333333', 'avatar_mango_samurai', 'Mango Samurai', true),
  ('a4444444-4444-4444-4444-444444444444', 'avatar_avocado_alchemist', 'Avocado Alchemist', true),
  ('a5555555-5555-5555-5555-555555555555', 'avatar_wasabi_warrior', 'Wasabi Warrior', true),
  ('a6666666-6666-6666-6666-666666666666', 'avatar_wakame_wizard', 'Wakame Wizard', true),
  ('a7777777-7777-7777-7777-777777777777', 'avatar_ginger_gladiator', 'Ginger Gladiator', true),
  ('a8888888-8888-8888-8888-888888888811', 'avatar_acai_archer', 'Açai Archer', true)
ON CONFLICT (asset_key) DO UPDATE SET label = EXCLUDED.label, is_active = EXCLUDED.is_active;

-- End of Migration v4

-- Migration v5: House Arena Authoritative Tournament Engine & Housekeeping
-- This migration implements the server-controlled real-time state machine.
-- Runs automatically on client interactions (polls and heartbeats) using row-level locking.

-- 1. Create or replace the master room-level housekeeping function
CREATE OR REPLACE FUNCTION process_room_housekeeping(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_lobby_ends TIMESTAMPTZ;
  v_tournament_started TIMESTAMPTZ;
  v_last_activity TIMESTAMPTZ;
  v_active_count INTEGER;
  v_round_id UUID;
  v_round_number INTEGER;
  v_game_type TEXT;
  v_round_ends TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ;
BEGIN
  -- Row-level lock on the master room record to serialize execution and prevent race conditions
  SELECT status, lobby_ends_at, tournament_started_at, last_activity_at
  INTO v_status, v_lobby_ends, v_tournament_started, v_last_activity
  FROM arena_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RETURN;
  END IF;

  -- A. Disconnect participants that haven't sent heartbeats in 60 seconds
  UPDATE arena_participants
  SET is_active = false, status = 'disconnected'
  WHERE room_id = p_room_id AND is_active = true AND last_seen_at < NOW() - INTERVAL '60 seconds';

  -- Compute current active count
  SELECT COUNT(*)::integer INTO v_active_count
  FROM arena_participants
  WHERE room_id = p_room_id AND is_active = true;

  -- B. State Transitions
  
  -- 1. LOBBY PHASE
  IF v_status = 'lobby' THEN
    IF NOW() >= v_lobby_ends THEN
      IF v_active_count < 2 THEN
        -- Close room due to insufficient players
        UPDATE arena_rooms
        SET status = 'closed',
            closed_at = NOW(),
            close_reason = CASE WHEN v_active_count = 0 THEN 'empty_lobby'::text ELSE 'insufficient_lobby_participants'::text END
        WHERE id = p_room_id;

        INSERT INTO arena_events (room_id, event_type, payload)
        VALUES (p_room_id, 'room_closed', jsonb_build_object(
          'reason', CASE WHEN v_active_count = 0 THEN 'empty_lobby' ELSE 'insufficient_lobby_participants' END,
          'active_players', v_active_count
        ));
      ELSE
        -- Transition to starting state
        UPDATE arena_rooms
        SET status = 'starting',
            tournament_started_at = NOW()
        WHERE id = p_room_id;

        INSERT INTO arena_events (room_id, event_type, payload)
        VALUES (p_room_id, 'tournament_started', jsonb_build_object('active_players', v_active_count));
      END IF;
    END IF;

  -- 2. STARTING PHASE (Short 5-second waiting window)
  ELSIF v_status = 'starting' THEN
    IF NOW() >= v_tournament_started + INTERVAL '5 seconds' THEN
      -- Transition to active phase and start Round 1
      UPDATE arena_rooms
      SET status = 'active',
          current_round_number = 1,
          current_game_type = 'slop_clock',
          last_activity_at = NOW()
      WHERE id = p_room_id;

      -- Create Round 1: slop_clock (600s duration)
      INSERT INTO arena_rounds (room_id, round_number, game_type, status, starts_at, ends_at)
      VALUES (p_room_id, 1, 'slop_clock', 'active', NOW(), NOW() + INTERVAL '600 seconds')
      RETURNING id INTO v_round_id;

      -- Update participants to playing
      UPDATE arena_participants
      SET status = 'playing'
      WHERE room_id = p_room_id AND is_active = true;

      -- Map active players to Round 1 stats
      INSERT INTO arena_round_participants (room_id, round_id, participant_id, joined_late, round_start_score, round_score, status)
      SELECT p_room_id, v_round_id, id, false, 0, 0, 'active'
      FROM arena_participants
      WHERE room_id = p_room_id AND is_active = true
      ON CONFLICT (round_id, participant_id) DO NOTHING;

      INSERT INTO arena_events (room_id, event_type, payload)
      VALUES (p_room_id, 'round_started', jsonb_build_object('round_number', 1, 'game_type', 'slop_clock'));
    END IF;

  -- 3. ACTIVE TOURNAMENT GAMEPLAY
  ELSIF v_status = 'active' THEN
    -- Check if there's an active round
    SELECT id, round_number, game_type, ends_at INTO v_round_id, v_round_number, v_game_type, v_round_ends
    FROM arena_rounds
    WHERE room_id = p_room_id AND status = 'active'
    LIMIT 1;

    IF v_round_id IS NOT NULL THEN
      -- Round is running: check if round has expired
      IF NOW() >= v_round_ends THEN
        -- Complete the active round
        UPDATE arena_rounds
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = v_round_id;

        UPDATE arena_round_participants
        SET status = 'completed'
        WHERE round_id = v_round_id AND status = 'active';

        -- Shift active participants to ranking review phase
        UPDATE arena_participants
        SET status = 'ranking'
        WHERE room_id = p_room_id AND is_active = true;

        UPDATE arena_rooms
        SET current_game_type = NULL,
            last_activity_at = NOW()
        WHERE id = p_room_id;

        INSERT INTO arena_events (room_id, event_type, payload)
        VALUES (p_room_id, 'round_completed', jsonb_build_object('round_id', v_round_id, 'round_number', v_round_number));
      END IF;
    ELSE
      -- No active round: we are in a transition phase.
      -- Fetch the latest completed round
      SELECT round_number, completed_at INTO v_round_number, v_completed_at
      FROM arena_rounds
      WHERE room_id = p_room_id AND status = 'completed'
      ORDER BY round_number DESC
      LIMIT 1;

      IF v_round_number IS NOT NULL THEN
        IF v_round_number = 1 THEN
          -- Transitioning from Round 1 to Round 2 (after 10s delay)
          IF NOW() >= v_completed_at + INTERVAL '10 seconds' THEN
            -- Start Round 2: quick_think (300s duration)
            UPDATE arena_rooms
            SET current_round_number = 2,
                current_game_type = 'quick_think',
                last_activity_at = NOW()
            WHERE id = p_room_id;

            INSERT INTO arena_rounds (room_id, round_number, game_type, status, starts_at, ends_at)
            VALUES (p_room_id, 2, 'quick_think', 'active', NOW(), NOW() + INTERVAL '300 seconds')
            RETURNING id INTO v_round_id;

            UPDATE arena_participants
            SET status = 'playing'
            WHERE room_id = p_room_id AND is_active = true;

            INSERT INTO arena_round_participants (room_id, round_id, participant_id, joined_late, round_start_score, round_score, status)
            SELECT p_room_id, v_round_id, id, false, total_score, 0, 'active'
            FROM arena_participants
            WHERE room_id = p_room_id AND is_active = true
            ON CONFLICT (round_id, participant_id) DO NOTHING;

            INSERT INTO arena_events (room_id, event_type, payload)
            VALUES (p_room_id, 'round_started', jsonb_build_object('round_number', 2, 'game_type', 'quick_think'));
          END IF;
        ELSIF v_round_number = 2 THEN
          -- Transitioning from Round 2 to results (after 10s delay)
          IF NOW() >= v_completed_at + INTERVAL '10 seconds' THEN
            -- Complete the tournament
            UPDATE arena_rooms
            SET status = 'results',
                tournament_ended_at = NOW(),
                last_activity_at = NOW()
            WHERE id = p_room_id;

            UPDATE arena_participants
            SET status = 'results'
            WHERE room_id = p_room_id AND is_active = true;

            INSERT INTO arena_events (room_id, event_type, payload)
            VALUES (p_room_id, 'tournament_completed', jsonb_build_object('ended_at', NOW()));
          END IF;
        END IF;
      END IF;
    END IF;

  END IF;

  -- C. Inactivity Auto-Close (10 minutes of zero active heartbeats)
  IF v_status != 'closed' THEN
    IF v_active_count = 0 AND v_last_activity < NOW() - INTERVAL '10 minutes' THEN
      UPDATE arena_rooms
      SET status = 'closed',
          closed_at = NOW(),
          close_reason = 'inactive_timeout'
      WHERE id = p_room_id;

      INSERT INTO arena_events (room_id, event_type, payload)
      VALUES (p_room_id, 'room_closed', jsonb_build_object('reason', 'inactive_timeout'));
    END IF;
  END IF;

END;
$$;


-- 2. Update existing safe client functions to invoke room-level housekeeping dynamically

-- A. Update arena_heartbeat
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
  IF p_status NOT IN ('lobby', 'playing', 'ranking', 'results') THEN
    RAISE EXCEPTION 'Invalid state parameter: %', p_status;
  END IF;

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

  -- Trigger server-authoritative housekeeping for this room
  PERFORM process_room_housekeeping(v_room_id);

  -- Update participant timestamps
  UPDATE arena_participants
  SET last_seen_at = NOW(),
      is_active = true
  WHERE id = v_participant_id;

  -- Record activity to delay inactive auto-close sweeps
  UPDATE arena_rooms
  SET last_activity_at = NOW()
  WHERE id = v_room_id;

  -- Upsert presence row
  INSERT INTO arena_presence (room_id, participant_id, status, source, last_seen_at)
  VALUES (v_room_id, v_participant_id, p_status, 'browser', NOW())
  ON CONFLICT (room_id, participant_id) DO UPDATE
  SET status = EXCLUDED.status, source = EXCLUDED.source, last_seen_at = EXCLUDED.last_seen_at;

  RETURN true;
END;
$$;


-- B. Update get_arena_room_public_state
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
  SELECT id INTO v_room_id
  FROM arena_rooms
  WHERE room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF v_room_id IS NOT NULL THEN
    -- Trigger server-authoritative housekeeping on every state read
    PERFORM process_room_housekeeping(v_room_id);
  END IF;

  -- Query updated details after housekeeping
  SELECT id, status, lobby_ends_at, current_round_number, current_game_type, is_joinable
  INTO v_room_id, v_status, v_lobby_ends, v_current_round, v_game_type, v_joinable
  FROM vw_arena_room_public
  WHERE room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF v_room_id IS NULL THEN
    RETURN;
  END IF;

  -- Count active players
  SELECT COUNT(*)::integer INTO v_active_count
  FROM arena_participants
  WHERE room_id = v_room_id AND is_active = true;

  -- Lobby countdown calculation
  IF v_status = 'lobby' THEN
    v_lobby_countdown := GREATEST(0, EXTRACT(EPOCH FROM (v_lobby_ends - NOW()))::integer);
  END IF;

  -- Round countdown calculation
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


-- C. Update join_arena_room to process housekeeping first
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
  v_room_code := upper(trim(p_room_code));
  v_trimmed_name := trim(regexp_replace(p_display_name, '\s+', ' ', 'g'));
  v_trimmed_store := trim(regexp_replace(p_store_name, '\s+', ' ', 'g'));

  IF length(v_trimmed_name) < 2 OR length(v_trimmed_name) > 50 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 50 characters.';
  END IF;
  IF length(v_trimmed_store) < 2 OR length(v_trimmed_store) > 80 THEN
    RAISE EXCEPTION 'Store name must be between 2 and 80 characters.';
  END IF;

  SELECT id INTO v_room_id
  FROM arena_rooms
  WHERE room_code = v_room_code
  LIMIT 1;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room code % not found.', p_room_code;
  END IF;

  -- Run housekeeping first to catch any state transitions (e.g. lobby expired, inactive players cleared)
  PERFORM process_room_housekeeping(v_room_id);

  -- Now query room details
  SELECT status, lobby_ends_at, current_round_number, current_game_type
  INTO v_room_status, v_lobby_ends, v_current_round, v_game_type
  FROM arena_rooms
  WHERE id = v_room_id;

  IF v_room_status = 'closed' THEN
    RAISE EXCEPTION 'This room is closed.';
  END IF;

  v_is_late := (v_room_status != 'lobby');

  -- Select a unique avatar
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

  v_reconnect_token := encode(gen_random_bytes(16), 'hex');
  v_reconnect_token_hash := encode(digest(v_reconnect_token, 'sha256'), 'hex');

  INSERT INTO arena_participants (
    room_id, display_name, store_name, avatar_id, reconnect_token_hash, status, is_late_joiner, is_active
  )
  VALUES (
    v_room_id, v_trimmed_name, v_trimmed_store, v_avatar_id, v_reconnect_token_hash,
    CASE WHEN v_is_late THEN 'playing'::text ELSE 'lobby'::text END, v_is_late, true
  )
  RETURNING id INTO v_participant_id;

  INSERT INTO arena_presence (room_id, participant_id, status, source)
  VALUES (v_room_id, v_participant_id, CASE WHEN v_is_late THEN 'playing'::text ELSE 'lobby'::text END, 'server'::text);

  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (v_room_id, v_participant_id, 'participant_joined', jsonb_build_object('display_name', v_trimmed_name, 'avatar_asset_key', v_avatar_asset_key, 'is_host', false));

  IF v_is_late THEN
    INSERT INTO arena_events (room_id, participant_id, event_type, payload)
    VALUES (v_room_id, v_participant_id, 'late_joiner_entered', jsonb_build_object('display_name', v_trimmed_name));
    
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
      )
      ON CONFLICT (round_id, participant_id) DO NOTHING;
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


-- D. Update reconnect_arena_participant to process housekeeping first
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
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');

  SELECT p.id, p.room_id INTO v_participant_id, v_room_id
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash
    AND r.room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Invalid reconnection credentials or room code.';
  END IF;

  -- Run housekeeping first
  PERFORM process_room_housekeeping(v_room_id);

  -- Now retrieve fresh details
  SELECT p.display_name, p.store_name, p.is_late_joiner, r.status, r.current_round_number, r.current_game_type, a.asset_key
  INTO v_display_name, v_store_name, v_is_late, v_room_status, v_current_round, v_game_type, v_avatar_asset_key
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  JOIN arena_avatars a ON p.avatar_id = a.id
  WHERE p.id = v_participant_id;

  IF v_room_status = 'closed' THEN
    RAISE EXCEPTION 'Reconnection failed: This room is closed.';
  END IF;

  -- Restore active states
  UPDATE arena_participants
  SET is_active = true,
      last_seen_at = NOW(),
      status = CASE WHEN v_room_status = 'lobby' THEN 'lobby'::text ELSE 'playing'::text END
  WHERE id = v_participant_id;

  -- Re-establish presence
  INSERT INTO arena_presence (room_id, participant_id, status, source, last_seen_at)
  VALUES (v_room_id, v_participant_id, CASE WHEN v_room_status = 'lobby' THEN 'lobby'::text ELSE 'playing'::text END, 'reconnect'::text, NOW())
  ON CONFLICT (room_id, participant_id) DO UPDATE
  SET status = EXCLUDED.status, source = EXCLUDED.source, last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO arena_events (room_id, participant_id, event_type, payload)
  VALUES (v_room_id, v_participant_id, 'participant_reconnected', jsonb_build_object('display_name', v_display_name));

  -- Check for active rounds
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

-- Grant EXECUTE permission to public for the new housekeeping function just in case
GRANT EXECUTE ON FUNCTION process_room_housekeeping(UUID) TO anon, authenticated;

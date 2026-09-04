-- ============================================================================
-- MIGRATION V11: Clean Reconnection RPC Contract & Safe Room Closure Handling
-- Poke House Arena — Apply in Supabase SQL Editor
--
-- PURPOSE:
-- 1. Updates reconnect_arena_participant to return a structured 'closed' row
--    instead of raising generic P0001 exceptions when a room has ended.
-- 2. Maintains exact signature and table return columns for 100% backward
--    compatibility with all existing clients.
-- 3. Ensures search_path includes public, extensions, pg_temp for pgcrypto.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reconnect_arena_participant(
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
SET search_path = public, extensions, pg_temp
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
  -- Compute hash of reconnection token using pgcrypto digest
  v_hash := encode(digest(p_reconnect_token, 'sha256'), 'hex');

  -- Locate participant and associated room
  SELECT p.id, p.room_id INTO v_participant_id, v_room_id
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  WHERE p.reconnect_token_hash = v_hash
    AND r.room_code = upper(trim(p_room_code))
  LIMIT 1;

  -- If participant not found by token, check if the room itself is already closed
  IF v_participant_id IS NULL THEN
    SELECT id, status INTO v_room_id, v_room_status
    FROM arena_rooms
    WHERE room_code = upper(trim(p_room_code))
    LIMIT 1;

    IF v_room_status = 'closed' THEN
      -- Return graceful closed status without raising exception
      RETURN QUERY SELECT
        v_room_id as room_id,
        'closed'::TEXT as room_status,
        NULL::UUID as participant_id,
        ''::TEXT as display_name,
        ''::TEXT as store_name,
        ''::TEXT as avatar_asset_key,
        false as is_late_joiner,
        0 as current_round_number,
        ''::TEXT as current_game_type,
        0 as remaining_round_seconds;
      RETURN;
    END IF;

    RAISE EXCEPTION 'Invalid reconnection credentials or room code.';
  END IF;

  -- Run housekeeping first to evaluate current room and participant expirations
  PERFORM process_room_housekeeping(v_room_id);

  -- Retrieve fresh details after housekeeping
  SELECT p.display_name, p.store_name, p.is_late_joiner, r.status, r.current_round_number, r.current_game_type, a.asset_key
  INTO v_display_name, v_store_name, v_is_late, v_room_status, v_current_round, v_game_type, v_avatar_asset_key
  FROM arena_participants p
  JOIN arena_rooms r ON p.room_id = r.id
  LEFT JOIN arena_avatars a ON p.avatar_id = a.id
  WHERE p.id = v_participant_id;

  -- Gracefully return closed state instead of raising unhandled P0001 exception
  IF v_room_status = 'closed' THEN
    RETURN QUERY SELECT
      v_room_id as room_id,
      'closed'::TEXT as room_status,
      v_participant_id as participant_id,
      COALESCE(v_display_name, '') as display_name,
      COALESCE(v_store_name, '') as store_name,
      COALESCE(v_avatar_asset_key, '') as avatar_asset_key,
      COALESCE(v_is_late, false) as is_late_joiner,
      COALESCE(v_current_round, 0) as current_round_number,
      COALESCE(v_game_type, '')::TEXT as current_game_type,
      0 as remaining_round_seconds;
    RETURN;
  END IF;

  -- Restore active states for participant
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

  -- Check for active round timer
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
    COALESCE(v_current_round, 0) as current_round_number,
    COALESCE(v_game_type, '')::TEXT as current_game_type,
    v_remaining_seconds as remaining_round_seconds;
END;
$$;

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  ArenaRoom, 
  ArenaParticipant, 
  ArenaRoomCreateRequest, 
  ArenaRoomJoinRequest, 
  ArenaRoomStatus, 
  ArenaParticipantStatus,
  ArenaConnectionStatus,
  ArenaReconnectFailureReason
} from '../houseArena.types';
import { HouseArenaRoomService } from '../services/houseArenaRoom.service';
import { arenaSessionStorage } from '../services/houseArenaSession.storage';
import { classifyReconnectError, TERMINAL_RECONNECT_REASONS } from '../services/arenaErrorClassification';
import { getSupabaseClient } from '../../../services/supabase/client';

/**
 * Custom React Hook for Managing House Arena Room Lifecycle and State Machine
 * 
 * Guarantees:
 * - Single-flight reconnections to prevent race conditions and double-calls in Strict Mode
 * - Strict error classification distinguishing terminal from recoverable failures
 * - Complete automatic cleanup on room closure without emitting fatal AppErrors
 * - Safe resilience against background visibility and connection events
 */
export function useHouseArenaRoom() {
  const [activeRoom, setActiveRoom] = useState<ArenaRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<ArenaParticipant | null>(null);
  const [participants, setParticipants] = useState<ArenaParticipant[]>([]);
  const [reconnectToken, setReconnectToken] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ArenaConnectionStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const roomService = useMemo(() => new HouseArenaRoomService(), []);

  // Single-flight and concurrency control refs
  const reconnectPromiseRef = useRef<Promise<void> | null>(null);
  const hasAttemptedInitialRestoreRef = useRef(false);
  const activeRoomRef = useRef<ArenaRoom | null>(null);
  activeRoomRef.current = activeRoom;

  const getSupabase = () => {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  };

  /**
   * Terminal expiration of the current Arena session.
   * Cancels pending operations, purges stored credentials, cleans in-memory state,
   * and displays a discrete informational notice.
   */
  const expireArenaSession = useCallback((reason: ArenaReconnectFailureReason = 'room_closed') => {
    console.info('[useHouseArenaRoom] Session expired/terminated with reason:', reason);

    // Cancel any inflight promise
    reconnectPromiseRef.current = null;

    // Purge persistent storage completely
    arenaSessionStorage.clear();

    // Reset all in-memory room & player state
    setActiveRoom(null);
    setLocalPlayer(null);
    setParticipants([]);
    setReconnectToken(null);
    setIsLoading(false);
    setError(null);
    setConnectionStatus('expired');

    // Present discrete user notification
    if (reason === 'room_closed') {
      setInfoNotice('Esta sala já foi encerrada. Podes entrar ou criar uma nova sala.');
    } else if (reason === 'room_not_found' || reason === 'invalid_room_code') {
      setInfoNotice('A sala não foi encontrada ou o código é inválido.');
    } else if (reason === 'session_expired') {
      setInfoNotice('A sessão da sala expirou. Podes entrar ou criar uma nova sala.');
    } else if (reason === 'participant_removed') {
      setInfoNotice('Foste removido da sala.');
    }
  }, []);

  /**
   * Refresh current active participants list
   */
  const refreshParticipants = useCallback(async () => {
    if (!activeRoom?.id) return;
    try {
      const list = await roomService.getParticipants(activeRoom.id);
      setParticipants(list);
    } catch (e) {
      console.warn('[useHouseArenaRoom] Warning refreshing participants:', e);
    }
  }, [activeRoom?.id, roomService]);

  /**
   * Refresh current room state snapshot
   */
  const refreshRoomState = useCallback(async () => {
    if (!activeRoom?.id) return;
    try {
      const state = await roomService.getRoomState(activeRoom.id);
      if (state) {
        if (state.status === 'closed') {
          expireArenaSession('room_closed');
          return;
        }
        setActiveRoom(state);
      }
    } catch (e) {
      console.warn('[useHouseArenaRoom] Warning refreshing room state:', e);
    }
  }, [activeRoom?.id, expireArenaSession, roomService]);

  /**
   * Single-flight reconnection controller
   * Avoids duplicate concurrent requests across Strict Mode, rapid clicks, or visibility changes.
   */
  const reconnectOnce = useCallback(async (roomCode: string, token: string, isAuto = false): Promise<void> => {
    if (reconnectPromiseRef.current) {
      return reconnectPromiseRef.current;
    }

    const promise = (async () => {
      setIsLoading(true);
      setError(null);
      setInfoNotice(null);
      setConnectionStatus(isAuto ? 'validating' : 'reconnecting');

      try {
        const result = await roomService.reconnectToRoom(roomCode, token);

        if (result.status === 'room_closed') {
          expireArenaSession('room_closed');
          return;
        }

        if (result.status === 'joined') {
          setLocalPlayer(result.participant);
          setReconnectToken(result.reconnectToken);

          const roomState = await roomService.getRoomStateByCode(roomCode);
          if (!roomState || roomState.status === 'closed') {
            expireArenaSession('room_closed');
            return;
          }

          setActiveRoom(roomState);
          setConnectionStatus('connected');

          const currentParts = await roomService.getParticipants(roomState.id);
          setParticipants(currentParts);

          // Update persisted storage
          arenaSessionStorage.write({
            roomId: roomState.id,
            roomCode: roomCode.toUpperCase(),
            participantId: result.participant.id,
            reconnectToken: token,
            displayName: result.participant.displayName,
            storeName: result.participant.storeName,
            storedAt: Date.now()
          });
        } else {
          const failureReason = ('reason' in result && result.reason) 
            ? result.reason 
            : classifyReconnectError(result.status);

          if (TERMINAL_RECONNECT_REASONS.has(failureReason)) {
            expireArenaSession(failureReason);
          } else {
            setConnectionStatus('error');
            setError(result.status);
          }
        }
      } catch (err: unknown) {
        const failureReason = classifyReconnectError(err);
        if (TERMINAL_RECONNECT_REASONS.has(failureReason)) {
          expireArenaSession(failureReason);
        } else {
          setConnectionStatus('error');
          setError(err instanceof Error ? err.message : 'Reconnection failed');
        }
      } finally {
        setIsLoading(false);
        reconnectPromiseRef.current = null;
      }
    })();

    reconnectPromiseRef.current = promise;
    return promise;
  }, [expireArenaSession, roomService]);

  /**
   * Restores an existing session from local storage with validation.
   */
  const restoreArenaSession = useCallback(async () => {
    const persisted = arenaSessionStorage.read();
    if (!persisted) {
      setConnectionStatus('idle');
      return;
    }

    // Skip if already in an active room or in the middle of reconnecting
    if (activeRoomRef.current || reconnectPromiseRef.current) {
      return;
    }

    await reconnectOnce(persisted.roomCode, persisted.reconnectToken, true);
  }, [reconnectOnce]);

  /**
   * Invokes the creation pipeline to provision a new room lobby.
   */
  const createRoom = useCallback(async (request: ArenaRoomCreateRequest, gameType: string) => {
    setIsLoading(true);
    setError(null);
    setInfoNotice(null);
    try {
      const result = await roomService.createRoom(request.displayName, request.storeName, gameType);
      if (result.status === 'created') {
        setActiveRoom(result.room);
        setLocalPlayer(result.host);
        setReconnectToken(result.reconnectToken);
        setParticipants([result.host]);
        setConnectionStatus('connected');

        arenaSessionStorage.write({
          roomId: result.room.id,
          roomCode: result.room.roomCode,
          participantId: result.host.id,
          reconnectToken: result.reconnectToken,
          displayName: request.displayName,
          storeName: request.storeName,
          storedAt: Date.now()
        });
      } else {
        setError(result.status === 'unexpected_error' ? result.message : result.status);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown creation error');
    } finally {
      setIsLoading(false);
    }
  }, [roomService]);

  /**
   * Invokes the join pipeline to connect a participant to an existing room.
   */
  const joinRoom = useCallback(async (request: ArenaRoomJoinRequest) => {
    setIsLoading(true);
    setError(null);
    setInfoNotice(null);
    try {
      const result = await roomService.joinRoom(request);
      if (result.status === 'joined') {
        setLocalPlayer(result.participant);
        setReconnectToken(result.reconnectToken);

        const roomState = await roomService.getRoomStateByCode(request.roomCode);
        if (roomState) {
          if (roomState.status === 'closed') {
            expireArenaSession('room_closed');
            return;
          }

          setActiveRoom(roomState);
          setConnectionStatus('connected');

          const currentParts = await roomService.getParticipants(roomState.id);
          setParticipants(currentParts);

          arenaSessionStorage.write({
            roomId: roomState.id,
            roomCode: request.roomCode.toUpperCase(),
            participantId: result.participant.id,
            reconnectToken: result.reconnectToken,
            displayName: request.displayName,
            storeName: request.storeName,
            storedAt: Date.now()
          });
        } else {
          setError('room_not_found');
        }
      } else if (result.status === 'room_closed') {
        expireArenaSession('room_closed');
      } else {
        setError(result.status === 'unexpected_error' ? result.message : result.status);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown join error');
    } finally {
      setIsLoading(false);
    }
  }, [expireArenaSession, roomService]);

  /**
   * Leave the current room
   */
  const leaveRoom = useCallback(async () => {
    if (activeRoom?.roomCode && reconnectToken) {
      try {
        await roomService.leaveRoom(activeRoom.roomCode, reconnectToken);
      } catch (e) {
        console.warn('[useHouseArenaRoom] Error leaving room:', e);
      }
    }
    arenaSessionStorage.clear();
    setActiveRoom(null);
    setLocalPlayer(null);
    setParticipants([]);
    setReconnectToken(null);
    setError(null);
    setConnectionStatus('idle');
  }, [activeRoom?.roomCode, reconnectToken, roomService]);

  /**
   * Host starts the tournament room match
   */
  const hostStartRoom = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!activeRoom?.roomCode || !reconnectToken) {
      return { success: false, message: 'No active room or reconnect token' };
    }
    return await roomService.hostStartRoom(activeRoom.roomCode, reconnectToken);
  }, [activeRoom?.roomCode, reconnectToken, roomService]);

  /**
   * Resets state back to initial.
   */
  const resetRoomState = useCallback(() => {
    arenaSessionStorage.clear();
    setActiveRoom(null);
    setLocalPlayer(null);
    setParticipants([]);
    setReconnectToken(null);
    setError(null);
    setConnectionStatus('idle');
  }, []);

  // Initial session restoration guard (single execution, immune to Strict Mode double-invoke)
  useEffect(() => {
    if (hasAttemptedInitialRestoreRef.current) return;
    hasAttemptedInitialRestoreRef.current = true;

    const persisted = arenaSessionStorage.read();
    if (persisted) {
      restoreArenaSession();
    }
  }, [restoreArenaSession]);

  // Window events: only validate if a session is currently stored AND we are disconnected
  useEffect(() => {
    const handleRecheckSession = () => {
      if (activeRoomRef.current) return; // already connected
      const session = arenaSessionStorage.read();
      if (!session) return;
      restoreArenaSession();
    };

    window.addEventListener('online', handleRecheckSession);
    window.addEventListener('pageshow', handleRecheckSession);

    return () => {
      window.removeEventListener('online', handleRecheckSession);
      window.removeEventListener('pageshow', handleRecheckSession);
    };
  }, [restoreArenaSession]);

  /**
   * Realtime and Periodic State Sync Polling
   */
  useEffect(() => {
    if (!activeRoom?.roomCode || activeRoom.status === 'closed') return;

    const syncState = async () => {
      try {
        const state = await roomService.syncRoomState(activeRoom.roomCode);
        if (state) {
          if (state.status === 'closed') {
            expireArenaSession('room_closed');
            return;
          }
          setActiveRoom(prev => {
            if (!prev) return null;
            if (
              prev.status === state.status &&
              prev.currentRoundNumber === state.currentRoundNumber &&
              prev.currentGameType === state.currentGameType &&
              prev.activeParticipantCount === state.activeParticipantCount &&
              prev.remainingRoundSeconds === state.remainingRoundSeconds &&
              prev.lobbyCountdownSeconds === state.lobbyCountdownSeconds
            ) {
              return prev;
            }
            return {
              ...prev,
              status: state.status,
              currentRoundNumber: state.currentRoundNumber,
              currentGameType: state.currentGameType,
              activeParticipantCount: state.activeParticipantCount,
              remainingRoundSeconds: state.remainingRoundSeconds,
              lobbyCountdownSeconds: state.lobbyCountdownSeconds
            };
          });
        }
      } catch (e) {
        console.warn('[useHouseArenaRoom] syncRoomState error:', e);
      }
    };

    // Run immediately on active room state change
    syncState();
    refreshParticipants();

    // 4-second poll interval for robust synchronization
    const interval = setInterval(() => {
      syncState();
      refreshParticipants();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeRoom?.roomCode, activeRoom?.status, expireArenaSession, refreshParticipants, roomService]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    if (!activeRoom?.id || activeRoom.status === 'closed') return;

    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    const partsChannel = supabase
      .channel(`arena-participants-${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arena_participants',
          filter: `room_id=eq.${activeRoom.id}`
        },
        () => {
          refreshParticipants();
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`arena-room-state-${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'arena_rooms',
          filter: `id=eq.${activeRoom.id}`
        },
        (payload) => {
          const data = payload.new as any;
          if (data) {
            if (data.status === 'closed') {
              expireArenaSession('room_closed');
              return;
            }
            setActiveRoom(prev => {
              if (!prev) return null;
              return {
                ...prev,
                status: data.status as ArenaRoomStatus,
                currentRoundNumber: data.current_round_number,
                currentGameType: data.current_game_type,
                lobbyEndsAt: data.lobby_ends_at,
                tournamentStartedAt: data.tournament_started_at,
                tournamentEndedAt: data.tournament_ended_at,
                lastActivityAt: data.last_activity_at
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(partsChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [activeRoom?.id, activeRoom?.status, expireArenaSession, refreshParticipants]);

  return {
    activeRoom,
    localPlayer,
    participants,
    reconnectToken,
    connectionStatus,
    isLoading,
    error,
    infoNotice,
    setInfoNotice,
    createRoom,
    joinRoom,
    reconnect: reconnectOnce,
    restoreArenaSession,
    expireArenaSession,
    leaveRoom,
    hostStartRoom,
    resetRoomState,
    refreshParticipants,
    refreshRoomState
  };
}

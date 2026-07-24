import { useState, useCallback, useEffect, useMemo } from 'react';
import { ArenaRoom, ArenaParticipant, ArenaRoomCreateRequest, ArenaRoomJoinRequest, ArenaRoomStatus, ArenaParticipantStatus } from '../houseArena.types';
import { HouseArenaRoomService } from '../services/houseArenaRoom.service';
import { houseArenaSessionStorage } from '../services/houseArenaSession.storage';
import { getSupabaseClient } from '../../../services/supabase/client';

/**
 * Custom React Hook for Managing House Arena Room State
 * 
 * Provides state management, loading flags, error indicators, session persistence, 
 * and dual-mode real-time table subscriptions.
 */
export function useHouseArenaRoom() {
  const [activeRoom, setActiveRoom] = useState<ArenaRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<ArenaParticipant | null>(null);
  const [participants, setParticipants] = useState<ArenaParticipant[]>([]);
  const [reconnectToken, setReconnectToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomService = useMemo(() => new HouseArenaRoomService(), []);

  const getSupabase = () => {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  };

  /**
   * Refresh current active participants list
   */
  const refreshParticipants = useCallback(async () => {
    if (!activeRoom?.id) return;
    try {
      const list = await roomService.getParticipants(activeRoom.id);
      setParticipants(list);
    } catch (e) {
      console.error('[useHouseArenaRoom] Error refreshing participants:', e);
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
        setActiveRoom(state);
      }
    } catch (e) {
      console.error('[useHouseArenaRoom] Error refreshing room state:', e);
    }
  }, [activeRoom?.id, roomService]);

  /**
   * Invokes the creation pipeline to provision a new room lobby.
   */
  const createRoom = useCallback(async (request: ArenaRoomCreateRequest, gameType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await roomService.createRoom(request.displayName, request.storeName, gameType);
      if (result.status === 'created') {
        setActiveRoom(result.room);
        setLocalPlayer(result.host);
        setReconnectToken(result.reconnectToken);
        setParticipants([result.host]);

        // Securely store credentials locally for reconnection
        houseArenaSessionStorage.saveSession({
          roomCode: result.room.roomCode,
          reconnectToken: result.reconnectToken,
          displayName: request.displayName,
          storeName: request.storeName,
          joinedAt: result.room.createdAt
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
    try {
      const result = await roomService.joinRoom(request);
      if (result.status === 'joined') {
        setLocalPlayer(result.participant);
        setReconnectToken(result.reconnectToken);

        // Fetch entire room detail by code
        const roomState = await roomService.getRoomStateByCode(request.roomCode);
        if (roomState) {
          setActiveRoom(roomState);
          // Load existing participants
          const currentParts = await roomService.getParticipants(roomState.id);
          setParticipants(currentParts);

          // Securely store credentials locally for reconnection
          houseArenaSessionStorage.saveSession({
            roomCode: request.roomCode.toUpperCase(),
            reconnectToken: result.reconnectToken,
            displayName: request.displayName,
            storeName: request.storeName,
            joinedAt: new Date().toISOString()
          });
        } else {
          setError('room_not_found');
        }
      } else {
        setError(result.status === 'unexpected_error' ? result.message : result.status);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown join error');
    } finally {
      setIsLoading(false);
    }
  }, [roomService]);

  /**
   * Reconnects to an ongoing room session.
   */
  const reconnect = useCallback(async (roomCode: string, token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await roomService.reconnectToRoom(roomCode, token);
      if (result.status === 'joined') {
        setLocalPlayer(result.participant);
        setReconnectToken(result.reconnectToken);

        const roomState = await roomService.getRoomStateByCode(roomCode);
        if (roomState) {
          setActiveRoom(roomState);
          const currentParts = await roomService.getParticipants(roomState.id);
          setParticipants(currentParts);

          // Update saved session
          houseArenaSessionStorage.saveSession({
            roomCode: roomCode.toUpperCase(),
            reconnectToken: token,
            displayName: result.participant.displayName,
            storeName: result.participant.storeName,
            joinedAt: new Date().toISOString()
          });
        } else {
          setError('room_not_found');
        }
      } else {
        setError(result.status);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reconnection failed');
    } finally {
      setIsLoading(false);
    }
  }, [roomService]);

  /**
   * Leave the current room
   */
  const leaveRoom = useCallback(async () => {
    if (activeRoom?.roomCode && reconnectToken) {
      try {
        await roomService.leaveRoom(activeRoom.roomCode, reconnectToken);
      } catch (e) {
        console.error('[useHouseArenaRoom] Error leaving room:', e);
      }
    }
    houseArenaSessionStorage.clearSession();
    setActiveRoom(null);
    setLocalPlayer(null);
    setParticipants([]);
    setReconnectToken(null);
    setError(null);
  }, [activeRoom?.roomCode, reconnectToken, roomService]);

  /**
   * Resets state back to initial.
   */
  const resetRoomState = useCallback(() => {
    houseArenaSessionStorage.clearSession();
    setActiveRoom(null);
    setLocalPlayer(null);
    setParticipants([]);
    setReconnectToken(null);
    setError(null);
  }, []);

  /**
   * Realtime and Offline Simulation Subscriptions, plus Periodic State Sync Polling
   */
  useEffect(() => {
    if (!activeRoom?.roomCode || activeRoom.status === 'closed') return;

    const syncState = async () => {
      try {
        const state = await roomService.syncRoomState(activeRoom.roomCode);
        if (state) {
          setActiveRoom(prev => {
            if (!prev) return null;
            // Only update if there are changes to avoid excessive re-renders
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
        console.error('[useHouseArenaRoom] syncRoomState error:', e);
      }
    };

    // Run immediately on active room state change
    syncState();
    refreshParticipants();

    // Set up 4-second poll interval for robust sync + database housekeeping triggering
    const interval = setInterval(() => {
      syncState();
      refreshParticipants();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeRoom?.roomCode, activeRoom?.status, refreshParticipants, roomService]);

  useEffect(() => {
    if (!activeRoom?.id) return;

    const supabase = getSupabase();
    if (!supabase) {
      if (!import.meta.env.DEV) {
        return;
      }
      // Setup mock player joins timer for offline simulation!
      let timer: NodeJS.Timeout;
      const mockNames = ['Salmon Shogun', 'Mango Samurai', 'Avocado Alchemist', 'Wasabi Warrior'];
      const mockStores = ['Lisbon Chiado', 'Porto Clerigos', 'Cascais Surf', 'Faro Sun'];
      const mockAvatars = ['avatar_salmon_shogun', 'avatar_mango_samurai', 'avatar_avocado_alchemist', 'avatar_wasabi_warrior'];
      
      let index = 0;
      timer = setInterval(() => {
        if (index >= mockNames.length) {
          clearInterval(timer);
          return;
        }
        
        // Add a mock participant
        const savedPartsStr = localStorage.getItem('poke_house_mock_participants') || '[]';
        const parts = JSON.parse(savedPartsStr) as ArenaParticipant[];
        
        // Prevent duplicate joins if already simulated
        if (parts.some(p => p.displayName === mockNames[index])) {
          index++;
          return;
        }

        const newPart: ArenaParticipant = {
          id: 'part_mock_sim_' + index,
          roomId: activeRoom.id,
          displayName: mockNames[index],
          storeName: mockStores[index],
          avatarId: mockAvatars[index],
          joinedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          status: 'lobby',
          isLateJoiner: false,
          isHost: false,
          totalScore: 0,
          isActive: true
        };
        
        parts.push(newPart);
        localStorage.setItem('poke_house_mock_participants', JSON.stringify(parts));
        setParticipants(parts);
        
        // Update room participant count
        const savedRoomStr = localStorage.getItem('poke_house_mock_room');
        if (savedRoomStr) {
          const r = JSON.parse(savedRoomStr) as ArenaRoom;
          r.activeParticipantCount = parts.length;
          localStorage.setItem('poke_house_mock_room', JSON.stringify(r));
          setActiveRoom(r);
        }

        index++;
      }, 8000); // Add a player every 8 seconds

      return () => {
        clearInterval(timer);
      };
    }

    // Real supabase realtime subscriptions
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
  }, [activeRoom?.id, refreshParticipants]);

  return {
    activeRoom,
    localPlayer,
    participants,
    reconnectToken,
    isLoading,
    error,
    createRoom,
    joinRoom,
    reconnect,
    leaveRoom,
    resetRoomState,
    refreshParticipants,
    refreshRoomState
  };
}

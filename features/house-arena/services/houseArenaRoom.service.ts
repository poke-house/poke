import { 
  ArenaRoom, ArenaParticipant, ArenaRoomCreateRequest, ArenaRoomCreateResult,
  ArenaRoomJoinRequest, ArenaRoomJoinResult, ArenaRoomStatus, ArenaParticipantStatus,
  ArenaGameType
} from '../houseArena.types';
import { generateRoomCode, generateReconnectToken } from '../houseArena.utils';
import { getSupabaseClient } from '../../../services/supabase/client';

const MOCK_STORAGE_KEY_ROOM = 'poke_house_mock_room';
const MOCK_STORAGE_KEY_PARTS = 'poke_house_mock_participants';

/**
 * House Arena Room Service Interface
 * 
 * Defines Room lifecycle operations, database integrations, and fallback simulations.
 */
export class HouseArenaRoomService {
  
  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  /**
   * Creates a new tournament room with a unique random alphanumeric code.
   * Registers the host as the first participant.
   */
  async createRoom(displayName: string, storeName: string, gameType: string): Promise<ArenaRoomCreateResult> {
    try {
      if (!displayName.trim()) {
        return { status: 'invalid_name' };
      }
      if (!storeName.trim()) {
        return { status: 'invalid_store' };
      }

      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[HouseArenaRoomService] Supabase not available, using high-fidelity offline mock fallback');
          return this.createRoomMock(displayName, storeName, gameType);
        }
        return { status: 'unexpected_error', message: 'Supabase is not configured.' };
      }

      const { data, error } = await supabase.rpc('create_arena_room', {
        p_display_name: displayName.trim(),
        p_store_name: storeName.trim(),
        p_game_type: gameType
      });

      if (error) {
        console.error('[HouseArenaRoomService] RPC create_arena_room error:', error);
        return { status: 'unexpected_error', message: error.message };
      }

      if (!data || data.length === 0) {
        return { status: 'unexpected_error', message: 'No data returned from room creation' };
      }

      const row = data[0];

      // Query the created room to get full table details (createdAt, etc)
      const { data: roomData, error: roomError } = await supabase
        .from('arena_rooms')
        .select('*')
        .eq('room_code', row.room_code)
        .neq('status', 'closed')
        .single();

      if (roomError || !roomData) {
        console.error('[HouseArenaRoomService] Fetch created room details error:', roomError);
        return { status: 'unexpected_error', message: roomError?.message || 'Failed to fetch room details' };
      }

      const room: ArenaRoom = {
        id: roomData.id,
        roomCode: roomData.room_code,
        status: roomData.status as ArenaRoomStatus,
        createdAt: roomData.created_at,
        lobbyStartsAt: roomData.lobby_started_at,
        lobbyEndsAt: roomData.lobby_ends_at,
        tournamentStartedAt: roomData.tournament_started_at,
        tournamentEndedAt: roomData.tournament_ended_at,
        lastActivityAt: roomData.last_activity_at,
        activeParticipantCount: 1,
        currentRoundNumber: roomData.current_round_number,
        currentGameType: roomData.current_game_type,
        createdByParticipantId: roomData.created_by_participant_id,
        selectedGameType: roomData.selected_game_type || row.selected_game_type || gameType
      };

      const host: ArenaParticipant = {
        id: row.participant_id,
        roomId: room.id,
        displayName: displayName.trim(),
        storeName: storeName.trim(),
        avatarId: row.avatar_asset_key,
        joinedAt: room.createdAt,
        lastSeenAt: room.createdAt,
        status: 'lobby',
        isLateJoiner: false,
        isHost: true,
        totalScore: 0,
        isActive: true
      };

      return {
        status: 'created',
        room,
        host,
        reconnectToken: row.reconnect_token
      };
    } catch (err: unknown) {
      console.error('[HouseArenaRoomService] createRoom error:', err);
      return {
        status: 'unexpected_error',
        message: err instanceof Error ? err.message : String(err)
      };
    }
  }

  /**
   * Registers a participant to an existing active lobby.
   */
  async joinRoom(request: ArenaRoomJoinRequest): Promise<ArenaRoomJoinResult> {
    try {
      if (!request.roomCode.trim()) {
        return { status: 'invalid_room_code' };
      }
      if (!request.displayName.trim()) {
        return { status: 'name_required' };
      }
      if (!request.storeName.trim()) {
        return { status: 'store_required' };
      }

      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[HouseArenaRoomService] Supabase not available, using offline mock join');
          return this.joinRoomMock(request);
        }
        return { status: 'unexpected_error', message: 'Supabase is not configured.' };
      }

      const { data, error } = await supabase.rpc('join_arena_room', {
        p_room_code: request.roomCode.trim().toUpperCase(),
        p_display_name: request.displayName.trim(),
        p_store_name: request.storeName.trim()
      });

      if (error) {
        console.error('[HouseArenaRoomService] RPC join_arena_room error:', error);
        const msg = error.message || '';
        if (msg.includes('not found') || msg.includes('found')) {
          return { status: 'room_not_found' };
        }
        if (msg.includes('closed')) {
          return { status: 'room_closed' };
        }
        if (msg.includes('capacity') || msg.includes('maximum')) {
          return { status: 'avatar_unavailable' };
        }
        return { status: 'unexpected_error', message: msg };
      }

      if (!data || data.length === 0) {
        return { status: 'room_not_found' };
      }

      const row = data[0];

      const participant: ArenaParticipant = {
        id: row.participant_id,
        roomId: row.room_id,
        displayName: request.displayName.trim(),
        storeName: request.storeName.trim(),
        avatarId: row.avatar_asset_key,
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        status: (row.room_status === 'lobby' ? 'lobby' : 'playing') as ArenaParticipantStatus,
        isLateJoiner: row.is_late_joiner,
        isHost: false,
        totalScore: 0,
        isActive: true
      };

      return {
        status: 'joined',
        participant,
        reconnectToken: row.reconnect_token
      };
    } catch (err: unknown) {
      console.error('[HouseArenaRoomService] joinRoom error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('not found')) {
        return { status: 'room_not_found' };
      }
      if (msg.includes('closed')) {
        return { status: 'room_closed' };
      }
      return {
        status: 'unexpected_error',
        message: msg
      };
    }
  }

  /**
   * Re-establishes socket presence and retrieves room context using a stored reconnection token.
   */
  async reconnectToRoom(roomCode: string, token: string): Promise<ArenaRoomJoinResult> {
    try {
      if (!token || !roomCode) {
        return { status: 'reconnect_failed' };
      }

      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          console.log('[HouseArenaRoomService] Supabase unconfigured, executing offline mock reconnect');
          return this.reconnectMock(roomCode, token);
        }
        return { status: 'unexpected_error', message: 'Supabase is not configured.' };
      }

      const { data, error } = await supabase.rpc('reconnect_arena_participant', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: token.trim()
      });

      if (error) {
        console.error('[HouseArenaRoomService] RPC reconnect_arena_participant error:', error);
        return { status: 'reconnect_failed' };
      }

      if (!data || data.length === 0) {
        return { status: 'reconnect_failed' };
      }

      const row = data[0];

      const participant: ArenaParticipant = {
        id: row.participant_id,
        roomId: row.room_id,
        displayName: row.display_name,
        storeName: row.store_name,
        avatarId: row.avatar_asset_key,
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        status: (row.room_status === 'lobby' ? 'lobby' : 'playing') as ArenaParticipantStatus,
        isLateJoiner: row.is_late_joiner,
        isHost: false,
        totalScore: 0,
        isActive: true
      };

      // Check if host by querying table directly
      const { data: partData } = await supabase
        .from('arena_participants')
        .select('is_host')
        .eq('id', row.participant_id)
        .single();
      
      if (partData) {
        participant.isHost = partData.is_host;
      }

      return {
        status: 'joined',
        participant,
        reconnectToken: token
      };
    } catch (err: unknown) {
      console.error('[HouseArenaRoomService] reconnectToRoom unexpected error:', err);
      return { status: 'reconnect_failed' };
    }
  }

  async leaveRoom(roomCode: string, reconnectToken: string): Promise<boolean> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          localStorage.removeItem(MOCK_STORAGE_KEY_ROOM);
          return true;
        }
        return false;
      }
      const { error } = await supabase.rpc('leave_arena_room', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim()
      });
      if (error) {
        console.error('[HouseArenaRoomService] leave_arena_room error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[HouseArenaRoomService] leaveRoom error:', err);
      return false;
    }
  }

  /**
   * Fetch current room state snapshot.
   */
  async getRoomState(roomId: string): Promise<ArenaRoom | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          return this.getRoomStateMock(roomId);
        }
        return null;
      }

      const { data, error } = await supabase
        .from('arena_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        roomCode: data.room_code,
        status: data.status as ArenaRoomStatus,
        createdAt: data.created_at,
        lobbyStartsAt: data.lobby_started_at,
        lobbyEndsAt: data.lobby_ends_at,
        tournamentStartedAt: data.tournament_started_at,
        tournamentEndedAt: data.tournament_ended_at,
        lastActivityAt: data.last_activity_at,
        activeParticipantCount: 0, // Will be updated on count
        currentRoundNumber: data.current_round_number,
        currentGameType: data.current_game_type,
        createdByParticipantId: data.created_by_participant_id,
        selectedGameType: data.selected_game_type
      };
    } catch (err) {
      console.error('[HouseArenaRoomService] getRoomState error:', err);
      return null;
    }
  }

  /**
   * Synchronizes room state with the server and triggers housekeeping.
   */
  async syncRoomState(roomCode: string): Promise<{
    roomCode: string;
    status: ArenaRoomStatus;
    lobbyCountdownSeconds: number;
    activeParticipantCount: number;
    currentRoundNumber: number;
    currentGameType: ArenaGameType | null;
    remainingRoundSeconds: number;
    isJoinable: boolean;
  } | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          const mockRoom = this.getRoomStateMockByCode(roomCode);
          if (!mockRoom) return null;
          
          const lobbyEnds = new Date(mockRoom.lobbyEndsAt).getTime();
          const now = Date.now();
          const lobbyCountdown = Math.max(0, Math.floor((lobbyEnds - now) / 1000));
          
          if (mockRoom.status === 'lobby' && lobbyCountdown <= 0) {
            const savedPartsStr = localStorage.getItem('poke_house_mock_participants') || '[]';
            const parts = JSON.parse(savedPartsStr) as any[];
            if (parts.length >= 2) {
              mockRoom.status = 'starting';
              mockRoom.tournamentStartedAt = new Date().toISOString();
              localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
            } else {
              mockRoom.status = 'closed';
              (mockRoom as any).closed_at = new Date().toISOString();
              (mockRoom as any).close_reason = 'insufficient_lobby_participants';
              localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
            }
          } else if (mockRoom.status === 'starting') {
            const startedAt = new Date(mockRoom.tournamentStartedAt!).getTime();
            if (now >= startedAt + 5000) {
              mockRoom.status = 'active';
              mockRoom.currentRoundNumber = 1;
              mockRoom.currentGameType = 'slop_clock';
              const roundEnds = new Date(Date.now() + 600 * 1000).toISOString();
              localStorage.setItem('poke_house_mock_round_ends', roundEnds);
              localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
            }
          } else if (mockRoom.status === 'active') {
            const roundEndsStr = localStorage.getItem('poke_house_mock_round_ends');
            if (roundEndsStr) {
              const ends = new Date(roundEndsStr).getTime();
              if (now >= ends) {
                if (mockRoom.currentRoundNumber === 1) {
                  mockRoom.currentGameType = null;
                  localStorage.setItem('poke_house_mock_round_completed_at', new Date().toISOString());
                  localStorage.removeItem('poke_house_mock_round_ends');
                  localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
                } else if (mockRoom.currentRoundNumber === 2) {
                  mockRoom.currentGameType = null;
                  localStorage.setItem('poke_house_mock_round_completed_at', new Date().toISOString());
                  localStorage.removeItem('poke_house_mock_round_ends');
                  localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
                }
              }
            } else {
              const completedAtStr = localStorage.getItem('poke_house_mock_round_completed_at');
              if (completedAtStr) {
                const compAt = new Date(completedAtStr).getTime();
                if (now >= compAt + 10000) {
                  if (mockRoom.currentRoundNumber === 1) {
                    mockRoom.currentRoundNumber = 2;
                    mockRoom.currentGameType = 'quick_think';
                    localStorage.setItem('poke_house_mock_round_ends', new Date(Date.now() + 300 * 1000).toISOString());
                    localStorage.removeItem('poke_house_mock_round_completed_at');
                    localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
                  } else if (mockRoom.currentRoundNumber === 2) {
                    mockRoom.status = 'results';
                    mockRoom.tournamentEndedAt = new Date().toISOString();
                    localStorage.removeItem('poke_house_mock_round_completed_at');
                    localStorage.setItem('poke_house_mock_room', JSON.stringify(mockRoom));
                  }
                }
              }
            }
          }
          
          const roundEndsStr = localStorage.getItem('poke_house_mock_round_ends');
          const remainingRoundSeconds = roundEndsStr ? Math.max(0, Math.floor((new Date(roundEndsStr).getTime() - now) / 1000)) : 0;

          return {
            roomCode: mockRoom.roomCode,
            status: mockRoom.status,
            lobbyCountdownSeconds: lobbyCountdown,
            activeParticipantCount: mockRoom.activeParticipantCount,
            currentRoundNumber: mockRoom.currentRoundNumber,
            currentGameType: mockRoom.currentGameType as ArenaGameType | null,
            remainingRoundSeconds,
            isJoinable: mockRoom.status === 'lobby'
          };
        }
        return null;
      }

      const { data, error } = await supabase.rpc('get_arena_room_public_state', {
        p_room_code: roomCode.trim().toUpperCase()
      });

      if (error || !data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        roomCode: row.room_code,
        status: row.status as ArenaRoomStatus,
        lobbyCountdownSeconds: row.lobby_countdown_seconds,
        activeParticipantCount: row.active_participant_count,
        currentRoundNumber: row.current_round_number,
        currentGameType: row.current_game_type as ArenaGameType | null,
        remainingRoundSeconds: row.remaining_round_seconds,
        isJoinable: row.is_joinable
      };
    } catch (err) {
      console.error('[HouseArenaRoomService] syncRoomState error:', err);
      return null;
    }
  }

  /**
   * Fetch room state by alphanumeric room code.
   */
  async getRoomStateByCode(roomCode: string): Promise<ArenaRoom | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          return this.getRoomStateMockByCode(roomCode);
        }
        return null;
      }

      const { data, error } = await supabase
        .from('arena_rooms')
        .select('*')
        .eq('room_code', roomCode.trim().toUpperCase())
        .neq('status', 'closed')
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        roomCode: data.room_code,
        status: data.status as ArenaRoomStatus,
        createdAt: data.created_at,
        lobbyStartsAt: data.lobby_started_at,
        lobbyEndsAt: data.lobby_ends_at,
        tournamentStartedAt: data.tournament_started_at,
        tournamentEndedAt: data.tournament_ended_at,
        lastActivityAt: data.last_activity_at,
        activeParticipantCount: 0,
        currentRoundNumber: data.current_round_number,
        currentGameType: data.current_game_type,
        createdByParticipantId: data.created_by_participant_id,
        selectedGameType: data.selected_game_type
      };
    } catch (err) {
      console.error('[HouseArenaRoomService] getRoomStateByCode error:', err);
      return null;
    }
  }

  /**
   * Fetch active participants list.
   */
  async getParticipants(roomId: string): Promise<ArenaParticipant[]> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        if (import.meta.env.DEV) {
          return this.getParticipantsMock(roomId);
        }
        return [];
      }

      const { data, error } = await supabase
        .from('arena_participants')
        .select(`
          id,
          room_id,
          display_name,
          store_name,
          status,
          is_late_joiner,
          is_host,
          total_score,
          is_active,
          arena_avatars (
            asset_key,
            label
          )
        `)
        .eq('room_id', roomId)
        .eq('is_active', true);

      if (error) {
        console.error('[HouseArenaRoomService] Error fetching participants:', error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        roomId: item.room_id,
        displayName: item.display_name,
        storeName: item.store_name,
        avatarId: item.arena_avatars ? item.arena_avatars.asset_key : 'avatar_mochi_ninja',
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        status: item.status as ArenaParticipantStatus,
        isLateJoiner: item.is_late_joiner,
        isHost: item.is_host,
        totalScore: item.total_score || 0,
        isActive: item.is_active
      }));
    } catch (err) {
      console.error('[HouseArenaRoomService] getParticipants error:', err);
      return [];
    }
  }

  // ============================================================================
  // HIGH FIDELITY OFFLINE MOCKS
  // ============================================================================

  private createRoomMock(displayName: string, storeName: string, gameType: string): ArenaRoomCreateResult {
    const mockRoomId = 'room_' + Math.random().toString(36).substr(2, 9);
    const mockParticipantId = 'part_' + Math.random().toString(36).substr(2, 9);
    const roomCode = generateRoomCode();
    const reconnectToken = generateReconnectToken();
    const now = new Date().toISOString();
    const fiveMinLater = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const room: ArenaRoom = {
      id: mockRoomId,
      roomCode,
      status: 'lobby',
      createdAt: now,
      lobbyStartsAt: now,
      lobbyEndsAt: fiveMinLater,
      tournamentStartedAt: null,
      tournamentEndedAt: null,
      lastActivityAt: now,
      activeParticipantCount: 1,
      currentRoundNumber: 0,
      currentGameType: null,
      createdByParticipantId: mockParticipantId,
      selectedGameType: gameType || 'slop_clock'
    };

    const host: ArenaParticipant = {
      id: mockParticipantId,
      roomId: mockRoomId,
      displayName: displayName,
      storeName: storeName,
      avatarId: 'avatar_mochi_ninja',
      joinedAt: now,
      lastSeenAt: now,
      status: 'lobby',
      isLateJoiner: false,
      isHost: true,
      totalScore: 0,
      isActive: true
    };

    localStorage.setItem(MOCK_STORAGE_KEY_ROOM, JSON.stringify(room));
    localStorage.setItem(MOCK_STORAGE_KEY_PARTS, JSON.stringify([host]));

    return {
      status: 'created',
      room,
      host,
      reconnectToken
    };
  }

  private joinRoomMock(request: ArenaRoomJoinRequest): ArenaRoomJoinResult {
    const roomCode = request.roomCode.trim().toUpperCase();
    const savedRoomStr = localStorage.getItem(MOCK_STORAGE_KEY_ROOM);
    if (!savedRoomStr) {
      return { status: 'room_not_found' };
    }
    const room = JSON.parse(savedRoomStr) as ArenaRoom;
    if (room.roomCode !== roomCode) {
      return { status: 'room_not_found' };
    }
    if (room.status === 'closed') {
      return { status: 'room_closed' };
    }

    const savedPartsStr = localStorage.getItem(MOCK_STORAGE_KEY_PARTS) || '[]';
    const participants = JSON.parse(savedPartsStr) as ArenaParticipant[];

    if (participants.length >= 8) {
      return { status: 'avatar_unavailable' };
    }

    const mockParticipantId = 'part_' + Math.random().toString(36).substr(2, 9);
    const reconnectToken = generateReconnectToken();
    const now = new Date().toISOString();

    const takenAvatars = participants.map(p => p.avatarId);
    const pool = [
      'avatar_mochi_ninja', 'avatar_salmon_shogun', 'avatar_mango_samurai',
      'avatar_avocado_alchemist', 'avatar_wasabi_warrior', 'avatar_wakame_wizard',
      'avatar_ginger_gladiator', 'avatar_acai_archer'
    ];
    const available = pool.filter(a => !takenAvatars.includes(a));
    const avatar = available[Math.floor(Math.random() * available.length)] || 'avatar_mochi_ninja';

    const participant: ArenaParticipant = {
      id: mockParticipantId,
      roomId: room.id,
      displayName: request.displayName,
      storeName: request.storeName,
      avatarId: avatar,
      joinedAt: now,
      lastSeenAt: now,
      status: 'lobby',
      isLateJoiner: false,
      isHost: false,
      totalScore: 0,
      isActive: true
    };

    participants.push(participant);
    room.activeParticipantCount = participants.length;

    localStorage.setItem(MOCK_STORAGE_KEY_ROOM, JSON.stringify(room));
    localStorage.setItem(MOCK_STORAGE_KEY_PARTS, JSON.stringify(participants));

    return {
      status: 'joined',
      participant,
      reconnectToken
    };
  }

  private reconnectMock(roomCode: string, token: string): ArenaRoomJoinResult {
    const savedRoomStr = localStorage.getItem(MOCK_STORAGE_KEY_ROOM);
    if (!savedRoomStr) {
      return { status: 'reconnect_failed' };
    }
    const room = JSON.parse(savedRoomStr) as ArenaRoom;
    if (room.roomCode !== roomCode.trim().toUpperCase()) {
      return { status: 'reconnect_failed' };
    }

    const savedPartsStr = localStorage.getItem(MOCK_STORAGE_KEY_PARTS) || '[]';
    const participants = JSON.parse(savedPartsStr) as ArenaParticipant[];

    const session = localStorage.getItem('poke_house_arena_session');
    if (!session) {
      return { status: 'reconnect_failed' };
    }
    const sess = JSON.parse(session);
    
    let participant = participants.find(p => p.displayName === sess.displayName);
    if (!participant) {
      participant = {
        id: 'part_reconnect_' + Math.random().toString(36).substr(2, 9),
        roomId: room.id,
        displayName: sess.displayName,
        storeName: sess.storeName,
        avatarId: 'avatar_mochi_ninja',
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        status: 'lobby',
        isLateJoiner: false,
        isHost: true,
        totalScore: 0,
        isActive: true
      };
      participants.push(participant);
      localStorage.setItem(MOCK_STORAGE_KEY_PARTS, JSON.stringify(participants));
    }

    return {
      status: 'joined',
      participant,
      reconnectToken: token
    };
  }

  private getRoomStateMock(roomId: string): ArenaRoom | null {
    const savedRoomStr = localStorage.getItem(MOCK_STORAGE_KEY_ROOM);
    if (!savedRoomStr) return null;
    const room = JSON.parse(savedRoomStr) as ArenaRoom;
    if (room.id !== roomId) return null;
    return room;
  }

  private getRoomStateMockByCode(roomCode: string): ArenaRoom | null {
    const savedRoomStr = localStorage.getItem(MOCK_STORAGE_KEY_ROOM);
    if (!savedRoomStr) return null;
    const room = JSON.parse(savedRoomStr) as ArenaRoom;
    if (room.roomCode !== roomCode.trim().toUpperCase()) return null;
    return room;
  }

  private getParticipantsMock(roomId: string): ArenaParticipant[] {
    const savedPartsStr = localStorage.getItem(MOCK_STORAGE_KEY_PARTS);
    if (!savedPartsStr) return [];
    const participants = JSON.parse(savedPartsStr) as ArenaParticipant[];
    return participants.filter(p => p.roomId === roomId && p.isActive);
  }
}


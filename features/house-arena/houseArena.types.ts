/**
 * House Arena Domain Type Definitions
 * 
 * This file serves as the technical type contract for the future multi-player component
 * of the Poke House Training platform, isolated under the `/features/house-arena/` boundary.
 */

/**
 * Valid room status values in the room life-cycle.
 */
export type ArenaRoomStatus = 
  | 'draft' 
  | 'lobby' 
  | 'starting' 
  | 'active' 
  | 'results' 
  | 'closed';

/**
 * Valid status states for room participants.
 */
export type ArenaParticipantStatus = 
  | 'joining' 
  | 'lobby' 
  | 'playing' 
  | 'ranking' 
  | 'results' 
  | 'disconnected' 
  | 'left';

/**
 * Distinct multiplayer game modes that can be initiated in tournament rounds.
 */
export type ArenaGameType = 
  | 'slop_clock'     // Hora do Lodo (Time-Attack Bowl Assembly)
  | 'quick_think'    // Pensa Rápido (Timed Quiz SOP Challenge)
  | 'memory_match';  // Memory Match (SOP Memory Trainer)

/**
 * Predefined reasons for why a tournament room has been terminated.
 */
export type ArenaRoomCloseReason = 
  | 'empty_lobby' 
  | 'insufficient_lobby_participants' 
  | 'inactive_timeout' 
  | 'manual_admin_close' 
  | 'system_error';

/**
 * A participant within a tournament room.
 */
export interface ArenaParticipant {
  id: string;
  roomId: string;
  displayName: string;
  storeName: string;
  avatarId: string;
  joinedAt: string;
  lastSeenAt: string;
  status: ArenaParticipantStatus;
  isLateJoiner: boolean;
  isHost: boolean;
  totalScore: number;
  isActive: boolean;
}

/**
 * Core room container tracking state, code, and authoritative timers.
 */
export interface ArenaRoom {
  id: string;
  roomCode: string; // 4-6 character alphanumeric join code
  status: ArenaRoomStatus;
  createdAt: string;
  lobbyStartsAt: string;
  lobbyEndsAt: string; // Used to drive the 5-minute autostart countdown
  tournamentStartedAt: string | null;
  tournamentEndedAt: string | null;
  lastActivityAt: string;
  activeParticipantCount: number;
  currentRoundNumber: number;
  currentGameType: ArenaGameType | null;
  createdByParticipantId: string;
  remainingRoundSeconds?: number;
  lobbyCountdownSeconds?: number;
  selectedGameType?: string | null;
}

/**
 * A specific game round played within a room's active tournament session.
 */
export interface ArenaRound {
  id: string;
  roomId: string;
  roundNumber: number;
  gameType: ArenaGameType;
  status: 'upcoming' | 'active' | 'completed';
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

/**
 * Tracks the specific scoring and join context of a participant for a single round.
 */
export interface ArenaRoundParticipantState {
  roomId: string;
  roundId: string;
  participantId: string;
  joinedLate: boolean;
  roundStartScore: number;
  roundEndScore: number;
  isEligibleForRoundRanking: boolean;
  joinedAt: string;
}

/**
 * Ephemeral browser heartbeat representation for tracking active presence.
 */
export interface ArenaPresenceHeartbeat {
  participantId: string;
  roomId: string;
  lastSeenAt: string;
  source: string; // 'browser' | 'mobile' | 'pwa'
  status: ArenaParticipantStatus;
}

/**
 * Unique visual identity avatar.
 */
export interface ArenaAvatar {
  id: string;
  label: string; // E.g., 'Açai Enthusiast', 'Salmon Shogun'
  assetKey: string; // Key resolving to real assets, keeping URLs isolated from schema
  isActive: boolean;
}

/**
 * Client room join input criteria.
 */
export interface ArenaRoomJoinRequest {
  roomCode: string;
  displayName: string;
  storeName: string;
  reconnectToken?: string; // Optional token to reconnect to an ongoing room session
}

/**
 * Classification of reconnection failure causes
 */
export type ArenaReconnectFailureReason =
  | 'room_closed'
  | 'room_not_found'
  | 'invalid_room_code'
  | 'participant_not_found'
  | 'participant_removed'
  | 'session_expired'
  | 'network_error'
  | 'unknown';

/**
 * State machine status for the House Arena room connection lifecycle
 */
export type ArenaConnectionStatus =
  | 'idle'
  | 'validating'
  | 'reconnecting'
  | 'connected'
  | 'expired'
  | 'error';

/**
 * Centralized persisted arena session representation
 */
export interface PersistedArenaSession {
  roomId: string;
  roomCode: string;
  participantId: string;
  reconnectToken: string;
  displayName: string;
  storeName: string;
  storedAt: number;
}

/**
 * Union response representing join room result states.
 */
export type ArenaRoomJoinResult =
  | { status: 'joined'; participant: ArenaParticipant; reconnectToken: string }
  | { status: 'room_not_found' }
  | { status: 'room_closed'; reason?: ArenaReconnectFailureReason }
  | { status: 'invalid_room_code' }
  | { status: 'name_required' }
  | { status: 'store_required' }
  | { status: 'avatar_unavailable' }
  | { status: 'reconnect_failed'; reason?: ArenaReconnectFailureReason }
  | { status: 'unexpected_error'; message: string };

/**
 * Client room creation criteria.
 */
export interface ArenaRoomCreateRequest {
  displayName: string;
  storeName: string;
}

/**
 * Union response representing room creation outcomes.
 */
export type ArenaRoomCreateResult =
  | { status: 'created'; room: ArenaRoom; host: ArenaParticipant; reconnectToken: string }
  | { status: 'invalid_name' }
  | { status: 'invalid_store' }
  | { status: 'unexpected_error'; message: string };

/**
 * Union response representing tournament start sequence triggers.
 */
export type ArenaTournamentStartResult =
  | { status: 'started' }
  | { status: 'cancelled_insufficient_participants' }
  | { status: 'room_closed' }
  | { status: 'unexpected_error'; message: string };

/**
 * Compiled entry on the scoreboard representing players rank, score, and success criteria.
 */
export interface ArenaLeaderboardEntry {
  rank: number;
  participantId: string;
  displayName: string;
  storeName: string;
  avatarId: string;
  score: number;
  isChampion: boolean;
}

/**
 * Representing an active or historical round challenge assigned by the server.
 */
export interface ArenaRoundChallenge {
  id: string;
  roomId: string;
  roundId: string;
  participantId: string;
  challengeSequence: number;
  recipeId: string;
  recipeSize: string;
  challengeStatus: 'active' | 'completed' | 'expired' | 'invalidated';
  startedAt: string;
  completedAt: string | null;
  expiredAt: string | null;
  completionPayload: Record<string, string[]> | null;
  scoreAwarded: number;
}

/**
 * Representation of a Slop Clock gameplay challenge served by the RPC.
 */
export interface SlopClockChallenge {
  challengeId: string;
  challengeSequence: number;
  recipeId: string;
  recipeName: string;
  recipeSize: string;
  recipeCategory: string;
  requiredIngredients: Record<string, string[]>;
  remainingRoundSeconds: number;
  roundScore: number;
  totalScore: number;
  challengeCompletionCount: number;
}

/**
 * Server-response payload following a Slop Clock bowl completion submission.
 */
export interface SlopClockSubmissionResult {
  isAccepted: boolean;
  reasonCategory: string;
  awardedScore: number;
  updatedRoundScore: number;
  updatedTotalScore: number;
  nextChallengeId: string | null;
  nextChallengeSequence: number | null;
  nextRecipeId: string | null;
  nextRecipeName: string | null;
  nextRecipeSize: string | null;
  nextRecipeCategory: string | null;
  nextRequiredIngredients: Record<string, string[]> | null;
  remainingRoundSeconds: number;
  challengeCompletionCount: number;
}


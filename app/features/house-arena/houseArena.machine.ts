import { ArenaRoomStatus, ArenaRoomCloseReason } from './houseArena.types';

/**
 * Pure State Machine and Transition Helpers for House Arena Room Lifecycle
 * 
 * Enforces valid transition paths during a multi-player tournament session.
 * Handled as a pure state engine to ensure safety, testability, and deterministic behavior.
 */

export interface TransitionResultSuccess {
  success: true;
  nextStatus: ArenaRoomStatus;
  metadata?: Record<string, unknown>;
}

export interface TransitionResultFailure {
  success: false;
  error: string;
}

export type TransitionResult = TransitionResultSuccess | TransitionResultFailure;

/**
 * Valid room status transition paths.
 */
const VALID_TRANSITIONS: Record<ArenaRoomStatus, ArenaRoomStatus[]> = {
  draft: ['lobby'],
  lobby: ['starting', 'closed'],
  starting: ['active', 'closed'],
  active: ['results', 'closed'],
  results: ['closed'],
  closed: [] // Terminal state
};

/**
 * Evaluates whether a proposed transition from current status to target status is permitted.
 * 
 * @param current Current room status
 * @param target Proposed target room status
 * @param context Transition context (player count, close reasons, etc.)
 */
export function transitionRoomStatus(
  current: ArenaRoomStatus,
  target: ArenaRoomStatus,
  context?: {
    activeParticipantCount?: number;
    closeReason?: ArenaRoomCloseReason;
  }
): TransitionResult {
  const allowedTargets = VALID_TRANSITIONS[current];

  // 1. Core State-to-State Validation
  if (!allowedTargets.includes(target)) {
    return {
      success: false,
      error: `Invalid transition: Cannot move room from '${current}' state directly to '${target}' state.`
    };
  }

  // 2. Specific Rule-Based Guard Evaluations
  
  // Transition: lobby -> starting
  // Requires: At least 2 active players to initiate a tournament starting sequence
  if (current === 'lobby' && target === 'starting') {
    const playerCount = context?.activeParticipantCount ?? 0;
    if (playerCount < 2) {
      return {
        success: false,
        error: `Cannot initiate starting state: Lobby has insufficient active participants (${playerCount}/2 required).`
      };
    }
  }

  // Transition: lobby -> closed (Timeout / Manual)
  if (current === 'lobby' && target === 'closed') {
    const reason = context?.closeReason || 'empty_lobby';
    return {
      success: true,
      nextStatus: 'closed',
      metadata: { reason, description: 'Lobby closed due to conditions: ' + reason }
    };
  }

  // Transition: starting -> active
  // Triggered when: Lobby autostart timer expires and tournament officially begins
  if (current === 'starting' && target === 'active') {
    return {
      success: true,
      nextStatus: 'active',
      metadata: { trigger: 'lobby_timer_expiration', ownership: 'Supabase Edge Function' }
    };
  }

  // Transition: active -> results
  // Triggered when: Tournament completes all configured rounds
  if (current === 'active' && target === 'results') {
    return {
      success: true,
      nextStatus: 'results',
      metadata: { trigger: 'tournament_rounds_completed', ownership: 'Tournament Service' }
    };
  }

  // Transition: results -> closed
  // Triggered when: 10 minutes elapsed with 0 active participants, or manually closed
  if (current === 'results' && target === 'closed') {
    const reason = context?.closeReason || 'inactive_timeout';
    return {
      success: true,
      nextStatus: 'closed',
      metadata: { reason, trigger: 'inactivity_threshold_expired', ownership: 'Db Cron Worker' }
    };
  }

  // Fallback default permit
  return {
    success: true,
    nextStatus: target
  };
}

/**
 * State Transition Guard Mapping & Ownership Documentation:
 * 
 * 1. draft -> lobby
 *    - Trigger: Host completes room setup (Name + Store).
 *    - Ownership: client-initiated room creation trigger via Room Service.
 * 
 * 2. lobby -> starting
 *    - Trigger: 5-minute Autostart countdown reaching the threshold or manual start (if enabled).
 *    - Guard: Active Participant Count >= 2.
 *    - Ownership: Supabase Database Trigger/Scheduler.
 * 
 * 3. lobby -> closed
 *    - Trigger: 5-minute Autostart countdown reaching 0 with < 2 participants.
 *    - Reason: 'insufficient_lobby_participants'
 *    - Ownership: Supabase Database Scheduler.
 * 
 * 4. starting -> active
 *    - Trigger: 10-second starting countdown reaching 0.
 *    - Ownership: Client triggers UI game launch, server updates status database-authoritatively.
 * 
 * 5. active -> results
 *    - Trigger: Final round gameplay timer ends and final scores are verified.
 *    - Ownership: Tournament Service score summation.
 * 
 * 6. results -> closed
 *    - Trigger: 10 consecutive minutes with activeParticipantCount == 0 (no heartbeat sessions).
 *    - Reason: 'inactive_timeout'
 *    - Ownership: Database Background Cron Worker (pg_cron or Edge Function trigger).
 */

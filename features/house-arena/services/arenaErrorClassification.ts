import { ArenaReconnectFailureReason } from '../houseArena.types';

/**
 * Set of failure reasons that indicate a session cannot be resumed.
 * Terminal failures MUST immediately purge local storage, cancel retries,
 * and transition the UI safely back to the lobby without emitting fatal AppErrors.
 */
export const TERMINAL_RECONNECT_REASONS = new Set<ArenaReconnectFailureReason>([
  'room_closed',
  'room_not_found',
  'invalid_room_code',
  'participant_not_found',
  'participant_removed',
  'session_expired'
]);

/**
 * Classifies an error caught during reconnection into a typed failure reason.
 */
export function classifyReconnectError(error: unknown): ArenaReconnectFailureReason {
  if (!error) return 'unknown';

  const candidate = error as {
    code?: string | number;
    message?: string;
    details?: string;
    hint?: string;
    status?: string | number;
  };

  const text = [
    candidate?.message,
    candidate?.details,
    candidate?.hint,
    typeof error === 'string' ? error : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 1. Room closed conditions (Postgres P0001 or explicit message)
  if (
    text.includes('room is closed') ||
    text.includes('room closed') ||
    text.includes('sala encerrada') ||
    text.includes('sala fechada') ||
    text.includes('this room is closed')
  ) {
    return 'room_closed';
  }

  // 2. Room not found
  if (
    text.includes('room not found') ||
    text.includes('room does not exist') ||
    text.includes('sala não encontrada')
  ) {
    return 'room_not_found';
  }

  // 3. Invalid room code / credentials
  if (
    text.includes('invalid room code') ||
    text.includes('invalid reconnection credentials') ||
    text.includes('código de sala inválido') ||
    text.includes('unauthorized: reconnection token')
  ) {
    return 'invalid_room_code';
  }

  // 4. Participant not found
  if (
    text.includes('participant not found') ||
    text.includes('participante não encontrado')
  ) {
    return 'participant_not_found';
  }

  // 5. Participant removed / kicked
  if (
    text.includes('participant removed') ||
    text.includes('participante removido')
  ) {
    return 'participant_removed';
  }

  // 6. Expired token / session
  if (
    candidate?.code === 'PGRST301' ||
    text.includes('jwt') ||
    text.includes('token expired') ||
    text.includes('session expired')
  ) {
    return 'session_expired';
  }

  // 7. Network / connection transient errors
  if (
    text.includes('failed to fetch') ||
    text.includes('network') ||
    text.includes('timeout') ||
    text.includes('aborted') ||
    text.includes('connection refused') ||
    candidate?.status === 0
  ) {
    return 'network_error';
  }

  return 'unknown';
}

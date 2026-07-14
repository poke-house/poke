import { ArenaAvatar } from './houseArena.types';
import { ARENA_AVATARS_POOL } from './houseArena.constants';

/**
 * Utility Helpers for House Arena multiplayer business logic
 */

/**
 * Generates an alphanumeric room code for multi-player lobbies.
 * E.g., "P4KA3"
 */
export function generateRoomCode(length = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded easily confused characters like O, 0, I, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates an opaque session reconnection token for participants.
 */
export function generateReconnectToken(): string {
  const arr = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(arr);
  } else {
    // Node or fallback environments
    for (let i = 0; i < 16; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
}

/**
 * Pure helper to pick an available unique avatar from the pool.
 * Decoupled from UI state to allow server-authoritative transaction execution in future phases.
 * 
 * @param takenAvatarIds List of avatar IDs already active inside the target room
 */
export function getAvailableAvatar(takenAvatarIds: string[]): ArenaAvatar | null {
  const available = ARENA_AVATARS_POOL.filter(avatar => !takenAvatarIds.includes(avatar.id));
  if (available.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Determines whether a participant joining at the current moment should be flagged as a late joiner.
 * 
 * @param lobbyEndsAtISO The ISO string timestamp when the lobby autostart timer officially expires
 */
export function evaluateLateJoiner(lobbyEndsAtISO: string): boolean {
  const lobbyEndsTime = new Date(lobbyEndsAtISO).getTime();
  const currentTime = Date.now();
  // If current timestamp is after lobbyEndsTime, they are a late joiner
  return currentTime > lobbyEndsTime;
}

/**
 * Utility for formatting the game types for UI and logs.
 */
export function getGameTypeLabel(gameType: string): string {
  switch (gameType) {
    case 'slop_clock':
      return 'Hora do Lodo (Time-Attack)';
    case 'quick_think':
      return 'Pensa Rápido (Quiz SOP)';
    case 'memory_match':
      return 'Memory Match (SOP Pairs)';
    default:
      return 'Unknown Mode';
  }
}

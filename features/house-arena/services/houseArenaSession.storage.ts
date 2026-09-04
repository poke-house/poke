import { PersistedArenaSession } from '../houseArena.types';

export { type PersistedArenaSession } from '../houseArena.types';

export interface ArenaStoredSession extends PersistedArenaSession {
  /** @deprecated use storedAt */
  joinedAt?: string;
}

const PRIMARY_STORAGE_KEY = 'poke_house_arena_session';

const LEGACY_STORAGE_KEYS = [
  'poke-house:arena-session',
  'poke_house_mock_room',
  'poke_house_mock_participants',
  'poke_house_mock_round_ends',
  'poke_house_mock_round_completed_at',
  'poke_house_mock_score',
  'poke_house_mock_challenge'
];

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Centralized Arena Session Storage Service
 * 
 * Provides atomic read/write/clear operations for persistent room credentials.
 * Automatically purges expired sessions and obsolete legacy cache keys.
 */
export const arenaSessionStorage = {
  /**
   * Safely reads and validates the current persisted Arena session.
   * Returns null if missing, malformed, or older than the TTL.
   */
  read(): PersistedArenaSession | null {
    try {
      const raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        this.clear();
        return null;
      }

      // Validate required reconnection identifiers
      if (!parsed.roomCode || !parsed.reconnectToken) {
        this.clear();
        return null;
      }

      // Compute timestamp regardless of format
      let storedAt = Number(parsed.storedAt);
      if (!storedAt || isNaN(storedAt)) {
        if (parsed.joinedAt) {
          storedAt = new Date(parsed.joinedAt).getTime();
        } else {
          storedAt = Date.now();
        }
      }

      // Enforce TTL
      if (Date.now() - storedAt > SESSION_TTL_MS) {
        console.info('[ArenaSessionStorage] Persisted session expired by TTL. Clearing.');
        this.clear();
        return null;
      }

      const session: PersistedArenaSession = {
        roomId: String(parsed.roomId || ''),
        roomCode: String(parsed.roomCode).trim().toUpperCase(),
        participantId: String(parsed.participantId || ''),
        reconnectToken: String(parsed.reconnectToken).trim(),
        displayName: String(parsed.displayName || ''),
        storeName: String(parsed.storeName || ''),
        storedAt
      };

      return session;
    } catch (e) {
      console.warn('[ArenaSessionStorage] Failed to read persisted session, purging:', e);
      this.clear();
      return null;
    }
  },

  /**
   * Persists active room credentials to storage.
   */
  write(session: Partial<PersistedArenaSession> & { roomCode: string; reconnectToken: string }): void {
    try {
      const payload: PersistedArenaSession = {
        roomId: session.roomId || '',
        roomCode: session.roomCode.trim().toUpperCase(),
        participantId: session.participantId || '',
        reconnectToken: session.reconnectToken.trim(),
        displayName: session.displayName || '',
        storeName: session.storeName || '',
        storedAt: session.storedAt || Date.now()
      };
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[ArenaSessionStorage] Failed to write session to localStorage:', e);
    }
  },

  /**
   * Completely purges the active Arena session and all legacy mock keys.
   */
  clear(): void {
    try {
      localStorage.removeItem(PRIMARY_STORAGE_KEY);
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[ArenaSessionStorage] Failed to clear session:', e);
    }
  },

  // =========================================================================
  // Backward-compatibility adapters
  // =========================================================================
  getSession(): PersistedArenaSession | null {
    return this.read();
  },

  saveSession(session: {
    roomCode: string;
    reconnectToken: string;
    displayName?: string;
    storeName?: string;
    joinedAt?: string;
    roomId?: string;
    participantId?: string;
  }): void {
    this.write({
      roomId: session.roomId || '',
      roomCode: session.roomCode,
      participantId: session.participantId || '',
      reconnectToken: session.reconnectToken,
      displayName: session.displayName || '',
      storeName: session.storeName || '',
      storedAt: session.joinedAt ? new Date(session.joinedAt).getTime() : Date.now()
    });
  },

  clearSession(): void {
    this.clear();
  }
};

/**
 * Backward compatibility alias
 */
export const houseArenaSessionStorage = arenaSessionStorage;

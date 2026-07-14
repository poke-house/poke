import { ArenaRoomJoinResult } from '../houseArena.types';

export interface ArenaStoredSession {
  roomCode: string;
  reconnectToken: string;
  displayName: string;
  storeName: string;
  joinedAt: string;
}

const STORAGE_KEY = 'poke_house_arena_session';

export const houseArenaSessionStorage = {
  /**
   * Saves the current active room session credentials in localStorage.
   */
  saveSession(session: ArenaStoredSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('[HouseArenaSessionStorage] Failed to save session:', e);
    }
  },

  /**
   * Retrieves any existing active room session credentials.
   */
  getSession(): ArenaStoredSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const session = JSON.parse(data) as ArenaStoredSession;
      
      // Expire sessions older than 2 hours (rooms auto-expire and close much faster)
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      if (new Date(session.joinedAt).getTime() < twoHoursAgo) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (e) {
      console.error('[HouseArenaSessionStorage] Failed to read session:', e);
      return null;
    }
  },

  /**
   * Clears any active room session credentials from storage.
   */
  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[HouseArenaSessionStorage] Failed to clear session:', e);
    }
  }
};

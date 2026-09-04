import { useEffect, useRef } from 'react';
import { presenceService } from '../services/houseArenaPresence.service';
import { HEARTBEAT_INTERVAL_SECONDS } from '../houseArena.constants';

/**
 * Custom React Hook for managing periodic client presence heartbeats (Scaffold)
 * 
 * Sets up a background timer to ping the presence endpoint while active in a room.
 * Handles auto-pausing when the window is hidden to save network resources.
 */
export function useHouseArenaPresence(
  participantId: string | null,
  roomId: string | null,
  roomCode: string | null,
  reconnectToken: string | null,
  playerStatus: string,
  isActive: boolean
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive || !participantId || !roomId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Dispatch immediate heartbeat on mount/activity
    presenceService.sendHeartbeat(participantId, roomId, roomCode, reconnectToken, playerStatus);

    // Setup periodic heartbeats
    intervalRef.current = setInterval(() => {
      presenceService.sendHeartbeat(participantId, roomId, roomCode, reconnectToken, playerStatus);
    }, HEARTBEAT_INTERVAL_SECONDS * 1000);

    // Pause heartbeats when user minimizes tab or navigates away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[useHouseArenaPresence] Window hidden. Pausing heartbeats.');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        console.log('[useHouseArenaPresence] Window visible. Resuming heartbeats.');
        presenceService.sendHeartbeat(participantId, roomId, roomCode, reconnectToken, playerStatus);
        
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            presenceService.sendHeartbeat(participantId, roomId, roomCode, reconnectToken, playerStatus);
          }, HEARTBEAT_INTERVAL_SECONDS * 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [participantId, roomId, roomCode, reconnectToken, playerStatus, isActive]);
}

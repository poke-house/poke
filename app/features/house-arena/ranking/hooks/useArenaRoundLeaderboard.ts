import { useState, useEffect, useCallback } from 'react';
import { ArenaRankingRow } from '../arenaRanking.types';
import { arenaRankingService } from '../services/arenaRanking.service';

export function useArenaRoundLeaderboard(roomCode: string, reconnectToken: string, pollIntervalMs = 4000) {
  const [data, setData] = useState<ArenaRankingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!roomCode || !reconnectToken) return;
    try {
      const rows = await arenaRankingService.getRoundLeaderboard(roomCode, reconnectToken);
      setData(rows);
      setError(null);
    } catch (err) {
      console.error('Error fetching round leaderboard:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, reconnectToken]);

  useEffect(() => {
    fetchLeaderboard();

    if (pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchLeaderboard, pollIntervalMs]);

  return { data, isLoading, error, refetch: fetchLeaderboard };
}

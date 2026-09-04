import { useState, useEffect, useCallback } from 'react';
import { ArenaParticipantRankSummary } from '../arenaRanking.types';
import { arenaRankingService } from '../services/arenaRanking.service';

export function useArenaParticipantRankSummary(roomCode: string, reconnectToken: string, pollIntervalMs = 4000) {
  const [data, setData] = useState<ArenaParticipantRankSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!roomCode || !reconnectToken) return;
    try {
      const summary = await arenaRankingService.getParticipantRankSummary(roomCode, reconnectToken);
      setData(summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching participant rank summary:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, reconnectToken]);

  useEffect(() => {
    fetchSummary();

    if (pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      fetchSummary();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchSummary, pollIntervalMs]);

  return { data, isLoading, error, refetch: fetchSummary };
}

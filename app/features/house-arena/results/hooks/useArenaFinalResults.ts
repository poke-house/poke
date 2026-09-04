import { useState, useEffect, useCallback } from 'react';
import { ArenaFinalResultsData } from '../arenaResults.types';
import { arenaResultsService } from '../services/arenaResults.service';

interface UseArenaFinalResultsProps {
  roomCode: string;
  reconnectToken: string | null;
  participantId: string | null;
}

export function useArenaFinalResults({ roomCode, reconnectToken, participantId }: UseArenaFinalResultsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<ArenaFinalResultsData | null>(null);

  const fetchResults = useCallback(async (isSilent = false) => {
    if (!reconnectToken) {
      setError('Missing reconnect token');
      setIsLoading(false);
      return;
    }

    try {
      if (!isSilent) {
        setIsLoading(true);
      }
      const data = await arenaResultsService.getFinalResults(roomCode, reconnectToken, participantId);
      setResultsData(data);
      setError(null);
    } catch (err) {
      console.error('[useArenaFinalResults] Failed to fetch final results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  }, [roomCode, reconnectToken, participantId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Periodic silent polling to refresh player statuses and final calculations
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResults(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchResults]);

  return {
    isLoading,
    error,
    resultsData,
    refresh: () => fetchResults(false)
  };
}

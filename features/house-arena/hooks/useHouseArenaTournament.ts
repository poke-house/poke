import { useState, useCallback } from 'react';
import { ArenaRound, ArenaGameType } from '../houseArena.types';
import { tournamentService } from '../services/houseArenaTournament.service';

/**
 * Custom React Hook for Orchestrating Tournament State & Active Game Rounds (Scaffold)
 * 
 * Manages timer count snapshots, round state listings, and scoring accumulation.
 */
export function useHouseArenaTournament(roomId: string | null) {
  const [currentRound, setCurrentRound] = useState<ArenaRound | null>(null);
  const [scoreSum, setScoreSum] = useState<number>(0);
  const [roundScores, setRoundScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Triggers the advancement to the next tournament round.
   */
  const advanceNextRound = useCallback(async (roundNumber: number, gameType: ArenaGameType) => {
    if (!roomId) return;
    try {
      const nextRound = await tournamentService.startNextRound(roomId, roundNumber, gameType);
      if (nextRound) {
        setCurrentRound(nextRound);
      }
    } catch (err) {
      console.error('[useHouseArenaTournament] Error advancing round:', err);
    }
  }, [roomId]);

  /**
   * Dispatches round final score to the scoreboard database.
   */
  const submitRoundScore = useCallback(async (roundId: string, score: number) => {
    setIsSubmitting(true);
    try {
      // TODO: Call Supabase secure submit RPC (matches `submit_round_score` logic)
      console.log(`[useHouseArenaTournament] Dispatched Round Score for Round ${roundId}: ${score} pts`);
      
      setRoundScores(prev => ({ ...prev, [roundId]: score }));
      setScoreSum(prev => prev + score);
    } catch (err) {
      console.error('[useHouseArenaTournament] Error submitting score:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Resets active tournament trackers.
   */
  const resetTournament = useCallback(() => {
    setCurrentRound(null);
    setScoreSum(0);
    setRoundScores({});
  }, []);

  return {
    currentRound,
    scoreSum,
    roundScores,
    isSubmitting,
    advanceNextRound,
    submitRoundScore,
    resetTournament
  };
}

import { ArenaLeaderboardEntry } from '../houseArena.types';

/**
 * House Arena Scoreboard and Leaderboard Service Interface (Scaffold)
 * 
 * Fetches rankings, aggregates user totals, and computes final champion standings.
 */
export class HouseArenaLeaderboardService {

  /**
   * Retrieves the current standings for the entire ongoing tournament.
   * Pulls aggregate scores across all finished rounds.
   */
  async getRoomLeaderboard(roomId: string): Promise<ArenaLeaderboardEntry[]> {
    // TODO: SELECT participantId, displayName, storeName, totalScore FROM arena_participants WHERE room_id = roomId ORDER BY totalScore DESC
    console.log('[LeaderboardService] Retrieving general standings for Room:', roomId);
    return [];
  }

  /**
   * Retrieves the standings for a single specific round.
   */
  async getRoundLeaderboard(roomId: string, roundId: string): Promise<ArenaLeaderboardEntry[]> {
    // TODO: SELECT * FROM arena_round_participants WHERE room_id = roomId AND round_id = roundId ORDER BY roundEndScore DESC
    console.log(`[LeaderboardService] Retrieving round standings for Room: ${roomId}, Round: ${roundId}`);
    return [];
  }

  /**
   * Crowns the champion and compiles the top 3 players for the final podium view.
   */
  async getFinalPodium(roomId: string): Promise<ArenaLeaderboardEntry[]> {
    // TODO: Retrieve top 3 players ordered by score, marking the rank 1 entry as isChampion = true
    console.log('[LeaderboardService] Preparing final crown podium for room:', roomId);
    return [];
  }
}
export const leaderboardService = new HouseArenaLeaderboardService();

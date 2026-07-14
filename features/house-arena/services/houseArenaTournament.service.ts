import { ArenaRound, ArenaTournamentStartResult, ArenaGameType } from '../houseArena.types';

/**
 * House Arena Tournament & Round Orchestration Service Interface (Scaffold)
 * 
 * Manages game transitions, round creations, and score validations.
 */
export class HouseArenaTournamentService {
  
  /**
   * Automatically launches the tournament if the 5-minute lobby timer expires and
   * active participant count is >= 2.
   * 
   * Future Supabase implementation details:
   * - Triggered by database server-less timer scheduler.
   * - Transition status to 'starting', pre-generate tournament rounds, and broadcast trigger.
   */
  async startTournamentIfEligible(roomId: string): Promise<ArenaTournamentStartResult> {
    // TODO: Verify player count in Database. If valid, update room status to 'starting'.
    console.log('[TournamentService] Evaluating tournament start qualifications for Room:', roomId);
    return { status: 'started' };
  }

  /**
   * Generates a new active round entry in the DB and selects the next game type.
   */
  async startNextRound(roomId: string, roundNumber: number, gameType: ArenaGameType): Promise<ArenaRound | null> {
    const now = new Date().toISOString();
    const endsAt = new Date(Date.now() + 60 * 1000).toISOString(); // 60-second round duration

    const newRound: ArenaRound = {
      id: `round_${roomId}_${roundNumber}`,
      roomId,
      roundNumber,
      gameType,
      status: 'active',
      startsAt: now,
      endsAt,
      createdAt: now
    };

    // TODO: Insert round record into `arena_rounds` table and broadcast state change
    console.log('[TournamentService] Starting Round:', newRound);
    return newRound;
  }

  /**
   * Fetches the current active round for a tournament room.
   */
  async getCurrentRound(roomId: string): Promise<ArenaRound | null> {
    // TODO: SELECT * FROM arena_rounds WHERE room_id = roomId AND status = 'active' LIMIT 1
    return null;
  }

  /**
   * Handles registering a participant that joined the room *after* the round has already started.
   * Participant will enter with 0 points and have access to only the remaining round time.
   */
  async joinActiveRoundAsLateParticipant(roomId: string, roundId: string, participantId: string): Promise<boolean> {
    // TODO: Insert row into `arena_round_participants` with `is_late_joiner = true` and `round_start_score = 0`.
    console.log(`[TournamentService] Player ${participantId} registered as a LATE JOINER for Round ${roundId} in Room ${roomId}`);
    return true;
  }

  /**
   * Marks a round as completed. Triggers final score aggregations for the round.
   */
  async completeRound(roundId: string): Promise<boolean> {
    // TODO: UPDATE arena_rounds SET status = 'completed' WHERE id = roundId
    console.log('[TournamentService] Completing round and locking submissions for:', roundId);
    return true;
  }

  /**
   * Summarizes all round scores and transitions room status to 'results', crowning the champion.
   */
  async completeTournament(roomId: string): Promise<boolean> {
    // TODO: Transition room status, sum scores from arena_round_participants, write final podium
    console.log('[TournamentService] Summing final scores and completing tournament for room:', roomId);
    return true;
  }
}
export const tournamentService = new HouseArenaTournamentService();

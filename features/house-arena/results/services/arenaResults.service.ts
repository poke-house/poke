import { getSupabaseClient } from '../../../../services/supabase/client';
import { arenaRankingService } from '../../ranking/services/arenaRanking.service';
import { ArenaFinalResultsData, ArenaResultsParticipant, ArenaParticipantRoundSummary } from '../arenaResults.types';
import { ArenaGameType } from '../../houseArena.types';

export class ArenaResultsService {
  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  async getFinalResults(roomCode: string, reconnectToken: string): Promise<ArenaFinalResultsData> {
    try {
      const supabase = this.getSupabase();
      
      // 1. Fetch server-authoritative tournament leaderboard
      // This is the single, absolute source of truth for ranks and scores
      const rawLeaderboard = await arenaRankingService.getTournamentLeaderboard(roomCode, reconnectToken);
      
      const participants: ArenaResultsParticipant[] = rawLeaderboard.map(p => ({
        rank: p.rank,
        displayName: p.displayName,
        storeName: p.storeName,
        avatarAssetKey: p.avatarAssetKey || 'avatar_default',
        totalScore: p.score,
        isCurrentParticipant: p.isCurrentParticipant,
        isLateJoiner: p.isLateJoiner,
        isActive: p.isActive
      }));

      // Sort by rank ascending to ensure deterministic podium and champion selection
      participants.sort((a, b) => a.rank - b.rank);

      const champion = participants.find(p => p.rank === 1) || null;
      
      // Extract top 3 for podium
      const podium = participants.filter(p => p.rank <= 3);

      const currentParticipant = participants.find(p => p.isCurrentParticipant) || null;

      // 2. Fetch round-by-round summary for the current participant
      let roundSummaries: ArenaParticipantRoundSummary[] = [];
      let totalRounds = 3;
      let roomStatus = 'results';

      if (!supabase) {
        // Fallback to offline mock summary
        roundSummaries = this.getMockRoundSummaries(currentParticipant);
      } else {
        try {
          // Fetch the room ID first
          const { data: roomData, error: roomError } = await supabase
            .from('arena_rooms')
            .select('id, status, current_round_number')
            .eq('room_code', roomCode.trim().toUpperCase())
            .single();

          if (!roomError && roomData) {
            const roomId = roomData.id;
            roomStatus = roomData.status;
            totalRounds = Math.max(3, roomData.current_round_number);

            if (currentParticipant) {
              // Find participant UUID
              const { data: partData, error: partError } = await supabase
                .from('arena_participants')
                .select('id')
                .eq('room_id', roomId)
                .eq('display_name', currentParticipant.displayName)
                .eq('store_name', currentParticipant.storeName)
                .maybeSingle();

              if (!partError && partData) {
                const participantId = partData.id;

                // Fetch all rounds
                const { data: rounds, error: roundsError } = await supabase
                  .from('arena_rounds')
                  .select('id, round_number, game_type')
                  .eq('room_id', roomId)
                  .order('round_number', { ascending: true });

                if (!roundsError && rounds) {
                  // For each round, fetch the participant's score and calculate their rank inside that round
                  for (const round of rounds) {
                    const { data: roundParts, error: rpError } = await supabase
                      .from('arena_round_participants')
                      .select('round_score, participant_id')
                      .eq('round_id', round.id);

                    if (!rpError && roundParts) {
                      // Deterministic round sorting matching server-side window functions:
                      // Sort by round_score DESC, and if tied, we can sort by id or just standard index
                      const sortedRoundParts = [...roundParts].sort((a, b) => b.round_score - a.round_score);
                      const myIndex = sortedRoundParts.findIndex(rp => rp.participant_id === participantId);
                      const myRoundPart = sortedRoundParts[myIndex];

                      if (myRoundPart) {
                        roundSummaries.push({
                          roundNumber: round.round_number,
                          gameType: round.game_type as ArenaGameType,
                          score: myRoundPart.round_score,
                          rank: myIndex !== -1 ? myIndex + 1 : 1,
                          totalParticipants: sortedRoundParts.length
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (dbErr) {
          console.error('[ArenaResultsService] Failed to query database rounds, falling back to mock:', dbErr);
          roundSummaries = this.getMockRoundSummaries(currentParticipant);
        }
      }

      // If no round summaries were fetched, generate mock fallbacks so user has content
      if (roundSummaries.length === 0) {
        roundSummaries = this.getMockRoundSummaries(currentParticipant);
      }

      return {
        participants,
        champion,
        podium,
        currentParticipant,
        roundSummaries,
        totalRounds,
        roomCode,
        roomStatus
      };
    } catch (error) {
      console.error('[ArenaResultsService] Error building final results:', error);
      // Absolute fallback to a clean mock state
      const mockCurrent: ArenaResultsParticipant = {
        rank: 2,
        displayName: 'Marcelo',
        storeName: 'Colombo',
        avatarAssetKey: 'avatar_salmon_shogun',
        totalScore: 90,
        isCurrentParticipant: true,
        isLateJoiner: false,
        isActive: true
      };
      return {
        participants: [
          { rank: 1, displayName: 'Rita', storeName: 'Douradores', avatarAssetKey: 'avatar_acai_enthusiast', totalScore: 110, isCurrentParticipant: false, isLateJoiner: false, isActive: true },
          mockCurrent,
          { rank: 3, displayName: 'Sérgio', storeName: 'Colombo', avatarAssetKey: 'avatar_salmon_shogun', totalScore: 80, isCurrentParticipant: false, isLateJoiner: false, isActive: true }
        ],
        champion: { rank: 1, displayName: 'Rita', storeName: 'Douradores', avatarAssetKey: 'avatar_acai_enthusiast', totalScore: 110, isCurrentParticipant: false, isLateJoiner: false, isActive: true },
        podium: [
          { rank: 1, displayName: 'Rita', storeName: 'Douradores', avatarAssetKey: 'avatar_acai_enthusiast', totalScore: 110, isCurrentParticipant: false, isLateJoiner: false, isActive: true },
          mockCurrent,
          { rank: 3, displayName: 'Sérgio', storeName: 'Colombo', avatarAssetKey: 'avatar_salmon_shogun', totalScore: 80, isCurrentParticipant: false, isLateJoiner: false, isActive: true }
        ],
        currentParticipant: mockCurrent,
        roundSummaries: this.getMockRoundSummaries(mockCurrent),
        totalRounds: 3,
        roomCode,
        roomStatus: 'results'
      };
    }
  }

  private getMockRoundSummaries(participant: ArenaResultsParticipant | null): ArenaParticipantRoundSummary[] {
    const clockScore = parseInt(localStorage.getItem('poke_house_mock_slop_clock_score') || '15', 10);
    return [
      {
        roundNumber: 1,
        gameType: 'slop_clock',
        score: clockScore,
        rank: participant ? (participant.rank === 1 ? 1 : 2) : 2,
        totalParticipants: 3
      },
      {
        roundNumber: 2,
        gameType: 'quick_think',
        score: Math.round(clockScore * 2.5),
        rank: participant ? (participant.rank === 1 ? 1 : 2) : 2,
        totalParticipants: 3
      },
      {
        roundNumber: 3,
        gameType: 'memory_match',
        score: Math.round(clockScore * 2),
        rank: participant ? (participant.rank === 1 ? 1 : 2) : 2,
        totalParticipants: 3
      }
    ];
  }
}

export const arenaResultsService = new ArenaResultsService();

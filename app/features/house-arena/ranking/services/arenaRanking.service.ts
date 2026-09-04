import { getSupabaseClient } from '../../../../services/supabase/client';
import { 
  ArenaRankingRow, ArenaRoundResults, ArenaTournamentResults, ArenaParticipantRankSummary 
} from '../arenaRanking.types';

export class ArenaRankingService {
  private getSupabase() {
    const res = getSupabaseClient();
    return res.status === 'available' ? res.client : null;
  }

  async getRoundLeaderboard(roomCode: string, reconnectToken: string): Promise<ArenaRankingRow[]> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        return this.getRoundLeaderboardMock(roomCode, reconnectToken);
      }

      const { data, error } = await supabase.rpc('get_arena_round_leaderboard', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim()
      });

      if (error) {
        console.error('[ArenaRankingService] Error fetching round leaderboard:', error);
        return this.getRoundLeaderboardMock(roomCode, reconnectToken);
      }

      return (data || []).map((row: any) => ({
        rank: row.rank,
        displayName: row.display_name,
        storeName: row.store_name,
        avatarAssetKey: row.avatar_asset_key,
        score: row.round_score,
        isCurrentParticipant: row.is_current_participant,
        isLateJoiner: row.is_late_joiner,
        participantStatus: row.participant_status,
        isActive: row.is_active
      }));
    } catch (err) {
      console.error('[ArenaRankingService] Unexpected error fetching round leaderboard:', err);
      return this.getRoundLeaderboardMock(roomCode, reconnectToken);
    }
  }

  async getTournamentLeaderboard(roomCode: string, reconnectToken: string): Promise<ArenaRankingRow[]> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        return this.getTournamentLeaderboardMock(roomCode, reconnectToken);
      }

      const { data, error } = await supabase.rpc('get_arena_tournament_leaderboard', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim()
      });

      if (error) {
        console.error('[ArenaRankingService] Error fetching tournament leaderboard:', error);
        return this.getTournamentLeaderboardMock(roomCode, reconnectToken);
      }

      return (data || []).map((row: any) => ({
        rank: row.rank,
        displayName: row.display_name,
        storeName: row.store_name,
        avatarAssetKey: row.avatar_asset_key,
        score: row.total_score,
        isCurrentParticipant: row.is_current_participant,
        isLateJoiner: row.is_late_joiner,
        participantStatus: row.participant_status,
        isActive: row.is_active
      }));
    } catch (err) {
      console.error('[ArenaRankingService] Unexpected error fetching tournament leaderboard:', err);
      return this.getTournamentLeaderboardMock(roomCode, reconnectToken);
    }
  }

  async getRoundResults(roomCode: string, reconnectToken: string): Promise<ArenaRoundResults | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        return this.getRoundResultsMock(roomCode, reconnectToken);
      }

      const { data, error } = await supabase.rpc('get_arena_round_results', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim()
      });

      if (error || !data || data.length === 0) {
        console.error('[ArenaRankingService] Error fetching round results:', error);
        return this.getRoundResultsMock(roomCode, reconnectToken);
      }

      const row = data[0];
      return {
        roundNumber: row.round_number,
        gameType: row.game_type,
        roundStatus: row.round_status,
        roundEndedAt: row.round_ended_at,
        currentParticipantRoundScore: row.current_participant_round_score,
        currentParticipantRoundRank: row.current_participant_round_rank,
        totalParticipantCount: row.total_participant_count,
        hasNextRound: row.has_next_round,
        nextRoundGameType: row.next_round_game_type
      };
    } catch (err) {
      console.error('[ArenaRankingService] Unexpected error fetching round results:', err);
      return this.getRoundResultsMock(roomCode, reconnectToken);
    }
  }

  async getTournamentResults(roomCode: string, reconnectToken: string): Promise<ArenaTournamentResults | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        return this.getTournamentResultsMock(roomCode, reconnectToken);
      }

      const { data, error } = await supabase.rpc('get_arena_tournament_results', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim()
      });

      if (error || !data || data.length === 0) {
        console.error('[ArenaRankingService] Error fetching tournament results:', error);
        return this.getTournamentResultsMock(roomCode, reconnectToken);
      }

      const row = data[0];
      return {
        tournamentComplete: row.tournament_complete,
        currentParticipantRank: row.current_participant_rank,
        currentParticipantTotalScore: row.current_participant_total_score,
        totalParticipantCount: row.total_participant_count,
        roomStatus: row.room_status
      };
    } catch (err) {
      console.error('[ArenaRankingService] Unexpected error fetching tournament results:', err);
      return this.getTournamentResultsMock(roomCode, reconnectToken);
    }
  }

  async getParticipantRankSummary(roomCode: string, reconnectToken: string): Promise<ArenaParticipantRankSummary | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) {
        return this.getParticipantRankSummaryMock(roomCode, reconnectToken);
      }

      const { data, error } = await supabase.rpc('get_arena_participant_rank_summary', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_reconnect_token: reconnectToken.trim()
      });

      if (error || !data || data.length === 0) {
        console.error('[ArenaRankingService] Error fetching participant rank summary:', error);
        return this.getParticipantRankSummaryMock(roomCode, reconnectToken);
      }

      const row = data[0];
      return {
        roundRank: row.round_rank,
        roundScore: row.round_score,
        tournamentRank: row.tournament_rank,
        tournamentScore: row.tournament_score,
        totalParticipantCount: row.total_participant_count,
        isLateJoiner: row.is_late_joiner
      };
    } catch (err) {
      console.error('[ArenaRankingService] Unexpected error fetching participant rank summary:', err);
      return this.getParticipantRankSummaryMock(roomCode, reconnectToken);
    }
  }

  // --- Mock Implementations for Offline Experience ---

  private getMockParticipants(): any[] {
    const partsStr = localStorage.getItem('poke_house_mock_participants') || '[]';
    return JSON.parse(partsStr);
  }

  private getMockCaller(reconnectToken: string): any {
    const parts = this.getMockParticipants();
    return parts[0] || null;
  }

  private getRoundLeaderboardMock(roomCode: string, reconnectToken: string): ArenaRankingRow[] {
    const parts = this.getMockParticipants();
    const caller = this.getMockCaller(reconnectToken);
    const activeScore = parseInt(localStorage.getItem('poke_house_mock_slop_clock_score') || '0', 10);
    
    const sorted = [...parts].map((p) => {
      let score = p.totalScore || 0;
      if (p.displayName === caller?.displayName) {
        score = activeScore;
      } else {
        score = (p.displayName.length % 5) + 1;
      }
      return {
        ...p,
        roundScore: score
      };
    }).sort((a, b) => b.roundScore - a.roundScore);

    return sorted.map((row, index) => ({
      rank: index + 1,
      displayName: row.displayName,
      storeName: row.storeName,
      avatarAssetKey: row.avatarId,
      score: row.roundScore,
      isCurrentParticipant: row.displayName === caller?.displayName,
      isLateJoiner: row.isLateJoiner || false,
      participantStatus: 'active',
      isActive: row.isActive !== false
    }));
  }

  private getTournamentLeaderboardMock(roomCode: string, reconnectToken: string): ArenaRankingRow[] {
    const parts = this.getMockParticipants();
    const caller = this.getMockCaller(reconnectToken);
    const activeScore = parseInt(localStorage.getItem('poke_house_mock_slop_clock_score') || '0', 10);

    const sorted = [...parts].map((p) => {
      let score = p.totalScore || 0;
      if (p.displayName === caller?.displayName) {
        score = activeScore;
      }
      return {
        ...p,
        score
      };
    }).sort((a, b) => b.score - a.score);

    return sorted.map((row, index) => ({
      rank: index + 1,
      displayName: row.displayName,
      storeName: row.storeName,
      avatarAssetKey: row.avatarId,
      score: row.score,
      isCurrentParticipant: row.displayName === caller?.displayName,
      isLateJoiner: row.isLateJoiner || false,
      participantStatus: 'active',
      isActive: row.isActive !== false
    }));
  }

  private getRoundResultsMock(roomCode: string, reconnectToken: string): ArenaRoundResults | null {
    const leaderboard = this.getRoundLeaderboardMock(roomCode, reconnectToken);
    const callerRow = leaderboard.find(r => r.isCurrentParticipant) || { score: 0, rank: 1 };
    
    const roomStr = localStorage.getItem('poke_house_mock_room');
    const room = roomStr ? JSON.parse(roomStr) : null;
    const roundNumber = room ? room.currentRoundNumber : 1;

    return {
      roundNumber,
      gameType: 'slop_clock',
      roundStatus: 'completed',
      roundEndedAt: new Date().toISOString(),
      currentParticipantRoundScore: callerRow.score,
      currentParticipantRoundRank: callerRow.rank,
      totalParticipantCount: leaderboard.length,
      hasNextRound: roundNumber === 1,
      nextRoundGameType: roundNumber === 1 ? 'quick_think' : null
    };
  }

  private getTournamentResultsMock(roomCode: string, reconnectToken: string): ArenaTournamentResults | null {
    const leaderboard = this.getTournamentLeaderboardMock(roomCode, reconnectToken);
    const callerRow = leaderboard.find(r => r.isCurrentParticipant) || { score: 0, rank: 1 };
    
    const roomStr = localStorage.getItem('poke_house_mock_room');
    const room = roomStr ? JSON.parse(roomStr) : null;

    return {
      tournamentComplete: room ? room.status === 'results' : true,
      currentParticipantRank: callerRow.rank,
      currentParticipantTotalScore: callerRow.score,
      totalParticipantCount: leaderboard.length,
      roomStatus: room ? room.status : 'results'
    };
  }

  private getParticipantRankSummaryMock(roomCode: string, reconnectToken: string): ArenaParticipantRankSummary | null {
    const roundL = this.getRoundLeaderboardMock(roomCode, reconnectToken);
    const tourneyL = this.getTournamentLeaderboardMock(roomCode, reconnectToken);
    
    const roundRow = roundL.find(r => r.isCurrentParticipant) || { score: 0, rank: 1, isLateJoiner: false };
    const tourneyRow = tourneyL.find(r => r.isCurrentParticipant) || { score: 0, rank: 1 };

    return {
      roundRank: roundRow.rank,
      roundScore: roundRow.score,
      tournamentRank: tourneyRow.rank,
      tournamentScore: tourneyRow.score,
      totalParticipantCount: roundL.length,
      isLateJoiner: roundRow.isLateJoiner
    };
  }
}

export const arenaRankingService = new ArenaRankingService();

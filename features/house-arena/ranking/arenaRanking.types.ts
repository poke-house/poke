export interface ArenaRankingRow {
  rank: number;
  displayName: string;
  storeName: string;
  avatarAssetKey: string;
  score: number;
  isCurrentParticipant: boolean;
  isLateJoiner: boolean;
  participantStatus: string;
  isActive: boolean;
}

export interface ArenaRoundResults {
  roundNumber: number;
  gameType: string;
  roundStatus: string;
  roundEndedAt: string | null;
  currentParticipantRoundScore: number;
  currentParticipantRoundRank: number;
  totalParticipantCount: number;
  hasNextRound: boolean;
  nextRoundGameType: string | null;
}

export interface ArenaTournamentResults {
  tournamentComplete: boolean;
  currentParticipantRank: number;
  currentParticipantTotalScore: number;
  totalParticipantCount: number;
  roomStatus: string;
}

export interface ArenaParticipantRankSummary {
  roundRank: number;
  roundScore: number;
  tournamentRank: number;
  tournamentScore: number;
  totalParticipantCount: number;
  isLateJoiner: boolean;
}

import { ArenaGameType } from '../houseArena.types';

export interface ArenaParticipantRoundSummary {
  roundNumber: number;
  gameType: ArenaGameType;
  score: number;
  rank: number;
  totalParticipants: number;
}

export interface ArenaResultsParticipant {
  rank: number;
  displayName: string;
  storeName: string;
  avatarAssetKey: string;
  totalScore: number;
  isCurrentParticipant: boolean;
  isLateJoiner: boolean;
  isActive: boolean;
}

export interface ArenaFinalResultsData {
  participants: ArenaResultsParticipant[];
  champion: ArenaResultsParticipant | null;
  podium: ArenaResultsParticipant[];
  currentParticipant: ArenaResultsParticipant | null;
  roundSummaries: ArenaParticipantRoundSummary[];
  totalRounds: number;
  roomCode: string;
  roomStatus: string;
}

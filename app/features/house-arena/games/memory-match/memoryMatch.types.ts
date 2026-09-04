export interface MemoryMatchCard {
  id: string;
  position: number;
  cardSide: 'left' | 'right';
  status: 'hidden' | 'revealed' | 'matched';
  labelPt: string | null;
  labelEn: string | null;
}

export interface MemoryMatchRoundState {
  cards: MemoryMatchCard[];
  roundScore: number;
  totalScore: number;
  remainingRoundSeconds: number;
  boardCompleted: boolean;
}

export interface MemoryMatchSubmissionResult {
  isMatch: boolean;
  scoreAwarded: number;
  updatedRoundScore: number;
  updatedTotalScore: number;
  boardCompleted: boolean;
  firstPairId: string;
  secondPairId: string;
}

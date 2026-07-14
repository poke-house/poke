/**
 * Pensa Rápido (Quick Think) Game-Specific Type Definitions
 */

export interface QuickThinkQuestionOption {
  id: string;
  text_pt: string;
  text_en: string;
}

export interface QuickThinkQuestionState {
  roundQuestionId: string | null; // Null represents the intervals/sync-gaps between questions
  questionId: string | null;
  questionOrder: number | null;
  questionPt: string | null;
  questionEn: string | null;
  options: QuickThinkQuestionOption[] | null;
  remainingQuestionSeconds: number;
  remainingRoundSeconds: number;
  roundScore: number;
  totalScore: number;
  isAnswered: boolean;
  answeredOptionId: string | null;
  correctOptionId: string | null; // Revealed server-side only after user has answered or time is up
  explanationPt: string | null;
  explanationEn: string | null;
}

export interface QuickThinkSubmissionResult {
  isAccepted: boolean;
  isCorrect: boolean;
  scoreAwarded: number;
  updatedRoundScore: number;
  updatedTotalScore: number;
  correctOptionId: string;
  explanationPt: string;
  explanationEn: string;
}

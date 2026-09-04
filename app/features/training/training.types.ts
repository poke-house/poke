import { Recipe, RecipePhaseKey, Language } from '../../types';

export interface BowlTrainingProps {
  selectedRecipe: Recipe;
  resetToHome: () => void;
  language: Language;
  t: (key: any, params?: Record<string, string | number>) => string;
}

export interface TrainingState {
  currentPhaseIndex: number;
  currentSelections: string[];
  allSelections: Record<string, string[]>;
  phaseOptions: string[];
  timer: number;
  lastFeedback: {
    type: 'correct' | 'incorrect' | null;
    message: string;
    item?: string;
  };
}

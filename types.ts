

export type Language = 'pt' | 'en';

export interface Variant {
  base: string[];
  sauce_base: string[];
  greens: string[];
  protein: string[];
  sauce_final: string[];
  crispy: string[];
  sesame: string[];
}

export interface Recipe {
  id: number;
  category: "HOUSE" | "GREEN" | "SMOOTHIE";
  name: string;
  variants?: {
    [key: string]: Variant;
  };
  smoothie_liquid?: string[];
  smoothie_amount?: string[];
  smoothie_ingredients?: string[];
  smoothie_ice?: string[];
  smoothie_mode?: string[];
}

export interface Theme {
  bg: string;
  border: string;
  text: string;
  btn_default: string;
  btn_active: string;
  binary: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[]; // A primeira opção será sempre a correta nos dados brutos
}

export interface IngredientDB {
  sizes: string[];
  bases: string[];
  sauces_base: string[];
  greens: string[];
  proteins: string[];
  sauces_final: string[];
  crispies: string[];
  sesame: string[];
  smoothie_liquid: string[];
  smoothie_amount: string[];
  smoothie_ingredients: string[];
  smoothie_ice: string[];
  smoothie_mode: string[];
}

export type GameState = "HOME" | "PLAYING" | "RESULT_SUCCESS" | "RESULT_FAIL" | "CUSTOM_BOWL" | "RUSH_SELECT" | "RUSH_PLAYING" | "RUSH_ERROR" | "RUSH_GAME_OVER" | "QUIZ_PLAYING" | "QUIZ_FEEDBACK" | "UNIVERSITY_SELECT" | "UNIVERSITY_PLAYING" | "UNIVERSITY_SUCCESS";

export interface Phase {
  key: string;
  title: string;
}

export interface PaPersona {
  name: string;
  emoji: string;
}

export interface RushScore {
  id?: string;
  player_name: string;
  store_name: string;
  score: number;
  created_at?: string;
}

export interface RushPlayer {
  name: string;
  store: string;
}

export interface BilingualMessage {
    pt: string;
    en: string;
}

declare global {
  // Correctly extend the global Window interface by using uppercase 'Window'
  interface Window {
    confetti: any;
    webkitAudioContext: typeof AudioContext;
  }
}
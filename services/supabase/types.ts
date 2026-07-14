import { SupabaseClient } from '@supabase/supabase-js';
import { RushScore, SupabaseAvailability } from '../../types';

export type ClassifiedErrorType = 
  | "err_unconfigured"
  | "err_network"
  | "err_validation"
  | "err_duplicate"
  | "err_unexpected";

export interface SubmitRushScoreInput {
  player_name: string;
  store_name: string;
  score: number;
  submission_id: string;
}

export interface SubmitRushScoreSuccess {
  success: true;
  data: RushScore;
}

export interface SubmitRushScoreFailure {
  success: false;
  error: string;
  classifiedError: ClassifiedErrorType;
}

export type SubmitRushScoreResult = SubmitRushScoreSuccess | SubmitRushScoreFailure;

export type SupabaseClientResult =
  | { status: "available"; client: SupabaseClient }
  | { status: "unconfigured"; client: null };

export interface GetRushLeaderboardResult {
  success: boolean;
  data: RushScore[];
  error?: string;
  classifiedError?: ClassifiedErrorType;
}

export interface GetRecentRushScoresResult {
  success: boolean;
  data: RushScore[];
  error?: string;
  classifiedError?: ClassifiedErrorType;
}

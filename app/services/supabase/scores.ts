import { getSupabaseClient } from './client';
import { SubmitRushScoreInput, SubmitRushScoreResult } from './types';
import { classifyError } from './errors';
import { RushScore } from '../../types';

/**
 * Safely submits a completed Rush Mode score using the secure Database RPC.
 * This prevents direct anonymous INSERT operations and enforces database-level validations.
 */
export async function submitRushScore(input: SubmitRushScoreInput): Promise<SubmitRushScoreResult> {
  const result = getSupabaseClient();
  if (result.status !== "available" || !result.client) {
    return {
      success: false,
      error: 'Supabase client is not configured.',
      classifiedError: 'err_unconfigured',
    };
  }

  const supabase = result.client;

  try {
    const { data, error } = await supabase.rpc('submit_rush_score', {
      p_player_name: input.player_name,
      p_store_name: input.store_name,
      p_score: input.score,
      p_submission_id: input.submission_id,
    });

    if (error) {
      console.error('Database RPC error submitting score:', error);
      return {
        success: false,
        error: error.message || 'An unknown database error occurred.',
        classifiedError: classifyError(error.message, error.code),
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No data was returned from the score submission.',
        classifiedError: 'err_unexpected',
      };
    }

    return {
      success: true,
      data: data as RushScore,
    };
  } catch (err) {
    console.error('Unexpected error in submitRushScore service:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return {
      success: false,
      error: message,
      classifiedError: classifyError(message),
    };
  }
}

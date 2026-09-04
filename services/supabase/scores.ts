import { getSupabaseClient } from './client';
import { SubmitRushScoreInput, SubmitRushScoreResult } from './types';
import { classifyError } from './errors';
import { RushScore } from '../../types';

/**
 * Safely submits a completed Rush Mode score using the secure Database RPC.
 * This prevents direct anonymous INSERT operations and enforces database-level validations.
 */
export async function submitRushScore(input: SubmitRushScoreInput): Promise<SubmitRushScoreResult> {
  // Validate input before sending to Supabase (aligned with PostgreSQL RPC rules)
  const trimmedPlayer = (input.player_name || '').trim().replace(/\s+/g, ' ');
  const trimmedStore = (input.store_name || '').trim().replace(/\s+/g, ' ');

  if (trimmedPlayer.length < 2 || trimmedPlayer.length > 50) {
    console.warn('[Supabase] Validation failed: player_name must be between 2 and 50 characters', { player_name: input.player_name });
    return {
      success: false,
      error: 'O nome deve ter entre 2 e 50 caracteres.',
      classifiedError: 'err_unexpected',
    };
  }

  if (trimmedStore.length < 2 || trimmedStore.length > 80) {
    console.warn('[Supabase] Validation failed: store_name must be between 2 and 80 characters', { store_name: input.store_name });
    return {
      success: false,
      error: 'O nome da loja deve ter entre 2 e 80 caracteres.',
      classifiedError: 'err_unexpected',
    };
  }

  if (typeof input.score !== 'number' || isNaN(input.score) || input.score < 0 || input.score > 1000) {
    console.warn('[Supabase] Validation failed: score must be between 0 and 1000', input.score);
    return {
      success: false,
      error: 'A pontuação deve estar entre 0 e 1000 pontos.',
      classifiedError: 'err_unexpected',
    };
  }

  const result = getSupabaseClient();
  if (result.status !== "available" || !result.client) {
    console.warn('[Supabase] Cannot submit score: Supabase client is not configured.');
    return {
      success: false,
      error: 'Servidor de classificações não configurado.',
      classifiedError: 'err_unconfigured',
    };
  }

  const supabase = result.client;
  console.info('[Supabase] Submitting rush score...', { player_name: trimmedPlayer, store_name: trimmedStore, score: input.score, submission_id: input.submission_id });

  try {
    const { data, error } = await supabase.rpc('submit_rush_score', {
      p_player_name: trimmedPlayer,
      p_store_name: trimmedStore,
      p_score: input.score,
      p_submission_id: input.submission_id,
    });

    if (error) {
      console.error('[Supabase] Error saving score:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return {
        success: false,
        error: error.message || 'An unknown database error occurred.',
        classifiedError: classifyError(error.message, error.code),
      };
    }

    if (!data) {
      console.error('[Supabase] No data returned from submit_rush_score RPC');
      return {
        success: false,
        error: 'No data was returned from the score submission.',
        classifiedError: 'err_unexpected',
      };
    }

    console.info('[Supabase] Score submitted successfully:', data);
    return {
      success: true,
      data: data as RushScore,
    };
  } catch (err) {
    console.error('[Supabase] Unexpected error in submitRushScore service:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return {
      success: false,
      error: message,
      classifiedError: classifyError(message),
    };
  }
}

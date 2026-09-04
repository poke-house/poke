import { getSupabaseClient } from './client';
import { GetRushLeaderboardResult, GetRecentRushScoresResult } from './types';
import { classifyError } from './errors';
import { RushScore } from '../../types';

/**
 * Fetches the prepared top best scores per player within the last 30 days from the database view.
 * Grouping, case-insensitive player matching, and tie-breaking are handled fully on the server side.
 */
export async function getRushLeaderboard(limit: number = 3): Promise<GetRushLeaderboardResult> {
  const result = getSupabaseClient();
  if (result.status !== "available" || !result.client) {
    return {
      success: false,
      data: [],
      error: 'Supabase client is not configured.',
      classifiedError: 'err_unconfigured',
    };
  }

  const supabase = result.client;
  console.info('[Supabase] Fetching leaderboard (limit: %d)...', limit);

  try {
    const { data, error } = await supabase
      .from('rush_leaderboard_30d')
      .select('id, player_name, store_name, score, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[Supabase] Error fetching leaderboard:', { code: error.code, message: error.message, details: error.details });
      return {
        success: false,
        data: [],
        error: error.message || 'Error fetching leaderboard',
        classifiedError: classifyError(error.message, error.code),
      };
    }

    console.info('[Supabase] Fetched %d leaderboard rows successfully', (data || []).length);
    return {
      success: true,
      data: (data || []) as RushScore[],
    };
  } catch (err) {
    console.error('[Supabase] Unexpected error in getRushLeaderboard:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return {
      success: false,
      data: [],
      error: message,
      classifiedError: classifyError(message),
    };
  }
}

/**
 * Fetches the prepared recent valid scores within the last 30 days from the database view.
 */
export async function getRecentRushScores(limit: number = 10): Promise<GetRecentRushScoresResult> {
  const result = getSupabaseClient();
  if (result.status !== "available" || !result.client) {
    return {
      success: false,
      data: [],
      error: 'Supabase client is not configured.',
      classifiedError: 'err_unconfigured',
    };
  }

  const supabase = result.client;
  console.info('[Supabase] Fetching recent rush scores (limit: %d)...', limit);

  try {
    const { data, error } = await supabase
      .from('rush_recent_scores_30d')
      .select('id, player_name, store_name, score, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Supabase] Error fetching recent rush scores:', { code: error.code, message: error.message, details: error.details });
      return {
        success: false,
        data: [],
        error: error.message || 'Error fetching recent scores',
        classifiedError: classifyError(error.message, error.code),
      };
    }

    console.info('[Supabase] Fetched %d recent rush scores successfully', (data || []).length);
    return {
      success: true,
      data: (data || []) as RushScore[],
    };
  } catch (err) {
    console.error('[Supabase] Unexpected error in getRecentRushScores:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return {
      success: false,
      data: [],
      error: message,
      classifiedError: classifyError(message),
    };
  }
}

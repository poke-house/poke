import { getSupabaseClient } from './client';
import { SupabaseAvailability } from '../../types';

/**
 * Checks if the Supabase configuration is present.
 */
export function isSupabaseConfigured(): boolean {
  const result = getSupabaseClient();
  return result.status === "available";
}

/**
 * Checks the current status of Supabase.
 * Returns:
 * - "unconfigured" if environment variables are missing
 * - "available" if configured
 */
export function getSupabaseAvailability(): SupabaseAvailability {
  const result = getSupabaseClient();
  if (result.status === "unconfigured") {
    return "unconfigured";
  }
  return "available";
}

import { ClassifiedErrorType } from './types';

/**
 * Classifies raw database or execution errors into safe, typed user-facing categories.
 * This prevents exposing raw database internals or SQL schemas to UI components.
 */
export function classifyError(errorMsg: string, code?: string): ClassifiedErrorType {
  const msg = (errorMsg || "").toLowerCase();
  
  if (msg.includes("not configured") || msg.includes("missing")) {
    return "err_unconfigured";
  }
  
  // PostgreSQL code 23505 is unique constraint violation
  if (code === "23505" || msg.includes("duplicate key") || msg.includes("unique constraint") || msg.includes("submission_id")) {
    return "err_duplicate";
  }

  // Check for validation errors raised from SQL constraints or custom raises
  if (
    msg.includes("between") || 
    msg.includes("characters") || 
    msg.includes("points") || 
    msg.includes("cannot be null") ||
    msg.includes("violates check constraint") ||
    msg.includes("chk_")
  ) {
    return "err_validation";
  }

  // Network/Connection errors
  if (
    msg.includes("failed to fetch") || 
    msg.includes("network") || 
    msg.includes("offline") || 
    msg.includes("timeout") || 
    msg.includes("connection") || 
    msg.includes("fetch failed") ||
    msg.includes("load failed") ||
    msg.includes("typeerror")
  ) {
    return "err_network";
  }

  return "err_unexpected";
}

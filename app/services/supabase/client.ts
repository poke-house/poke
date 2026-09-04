import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientResult } from './types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClientResult => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: "unconfigured", client: null };
  }

  // Check for placeholder values commonly found in templates or environment setups
  const isPlaceholderUrl = 
    supabaseUrl.includes("your-project") || 
    supabaseUrl.includes("placeholder") || 
    supabaseUrl.includes("YOUR_") ||
    supabaseUrl.includes("REPLACE_") ||
    !supabaseUrl.startsWith("https://");

  const isPlaceholderKey =
    supabaseAnonKey.includes("your-") ||
    supabaseAnonKey.includes("placeholder") ||
    supabaseAnonKey.includes("YOUR_") ||
    supabaseAnonKey.includes("REPLACE_");

  if (isPlaceholderUrl || isPlaceholderKey) {
    return { status: "unconfigured", client: null };
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.warn("Failed to create Supabase client:", e);
      return { status: "unconfigured", client: null };
    }
  }
  return { status: "available", client: supabaseInstance };
};

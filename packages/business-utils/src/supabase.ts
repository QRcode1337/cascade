import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Creates and configures a Supabase client
 * @param config - Supabase URL and anonymous key
 * @returns Configured Supabase client instance
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey);
}

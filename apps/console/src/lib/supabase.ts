import { createClient } from '@supabase/supabase-js';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client-side Supabase client (for realtime subscriptions)
export function createBrowserClient() {
  const anonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(supabaseUrl, anonKey);
}

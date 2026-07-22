import { createClient } from '@supabase/supabase-js';

export function createServerClient(accessToken: string) {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  var anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || !accessToken) return null;
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

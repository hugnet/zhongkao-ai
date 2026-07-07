import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function getCurrentUser() {
  var sb = getSupabase(); if (!sb) return null; const { data } = await sb.auth.getUser();
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  var sb = getSupabase(); if (!sb) throw new Error('Supabase not configured'); return sb.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  var sb = getSupabase(); if (!sb) throw new Error('Supabase not configured'); return sb.auth.signUp({ email, password });
}

export async function signOut() {
  var sb = getSupabase(); if (!sb) throw new Error('Supabase not configured'); await sb.auth.signOut();
}

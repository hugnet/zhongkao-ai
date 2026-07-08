let _sb: any = null;

function getClient() {
  if (_sb) return _sb;
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  var key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  try {
    var mod = require("@supabase/ssr");
    _sb = mod.createBrowserClient(url, key);
    return _sb;
  } catch(e) { return null; }
}

export function getSupabase() { return getClient(); }

export async function getCurrentUser() {
  var sb = getSupabase(); if (!sb) return null;
  var { data } = await sb.auth.getUser();
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  var sb = getSupabase(); if (!sb) throw new Error("Supabase not configured");
  return sb.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  var sb = getSupabase(); if (!sb) throw new Error("Supabase not configured");
  return sb.auth.signUp({ email, password });
}

export async function signOut() {
  var sb = getSupabase(); if (!sb) throw new Error("Supabase not configured");
  await sb.auth.signOut();
}

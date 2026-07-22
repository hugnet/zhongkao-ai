import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  var userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ settings: null });
  var sb = getSupabase();
  if (!sb) return NextResponse.json({ settings: { useDefaultApi: true } });
  var { data } = await sb.from('user_settings').select('*').eq('user_id', userId).single();
  return NextResponse.json({ settings: data || { useDefaultApi: true } });
}

export async function POST(req: NextRequest) {
  var body = await req.json();
  var { userId, customApiKey, customProviderId, useDefaultApi } = body;
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  var sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: true });
  var { data: existing } = await sb.from('user_settings').select('user_id').eq('user_id', userId).single();
  if (existing) {
    await sb.from('user_settings').update({ custom_api_key: customApiKey, custom_provider_id: customProviderId, use_default_api: useDefaultApi, updated_at: new Date().toISOString() }).eq('user_id', userId);
  } else {
    await sb.from('user_settings').insert({ user_id: userId, custom_api_key: customApiKey, custom_provider_id: customProviderId, use_default_api: useDefaultApi });
  }
  return NextResponse.json({ ok: true });
}

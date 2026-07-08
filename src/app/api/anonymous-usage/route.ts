import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

var FREE_LIMIT = 10;

function getSupabase() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { fingerprint, action } = body;
    if (!fingerprint) {
      return NextResponse.json({ ok: false, error: 'missing fingerprint' });
    }

    var ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    var sb = getSupabase();
    if (!sb) {
      return NextResponse.json({ ok: true, count: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT });
    }

    if (action === 'check') {
      var { data } = await sb.from('anonymous_usage').select('message_count').eq('fingerprint', fingerprint).single();
      var count = data ? data.message_count : 0;
      return NextResponse.json({
        ok: true,
        count: count,
        limit: FREE_LIMIT,
        remaining: Math.max(0, FREE_LIMIT - count),
        blocked: count >= FREE_LIMIT,
      });
    }

    if (action === 'increment') {
      var { data: existing } = await sb.from('anonymous_usage').select('id, message_count').eq('fingerprint', fingerprint).single();

      if (existing) {
        var newCount = existing.message_count + 1;
        if (newCount > FREE_LIMIT + 5) {
          return NextResponse.json({ ok: true, count: newCount, remaining: 0, blocked: true });
        }
        await sb.from('anonymous_usage').update({ message_count: newCount, updated_at: new Date().toISOString() }).eq('id', existing.id);
        return NextResponse.json({ ok: true, count: newCount, remaining: Math.max(0, FREE_LIMIT - newCount), blocked: newCount >= FREE_LIMIT });
      } else {
        await sb.from('anonymous_usage').insert({ fingerprint: fingerprint, ip_address: ip, message_count: 1 });
        return NextResponse.json({ ok: true, count: 1, remaining: FREE_LIMIT - 1, blocked: false });
      }
    }

    return NextResponse.json({ ok: false, error: 'unknown action' });
  } catch (err: any) {
    return NextResponse.json({ ok: true, count: 0, remaining: FREE_LIMIT, blocked: false });
  }
}

export async function GET(req: NextRequest) {
  var fp = req.nextUrl.searchParams.get('fingerprint');
  if (!fp) return NextResponse.json({ ok: false });
  var sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: true, count: 0, remaining: FREE_LIMIT });
  var { data } = await sb.from('anonymous_usage').select('message_count').eq('fingerprint', fp).single();
  var count = data ? data.message_count : 0;
  return NextResponse.json({ ok: true, count: count, remaining: Math.max(0, FREE_LIMIT - count) });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

var FREE_LIMIT = 10;

function getSupabase() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

function getClientIp(req: NextRequest): string {
  var raw = req.headers.get('x-forwarded-for') || '';
  var ip = raw.split(',')[0].trim();
  if (!ip) ip = req.headers.get('x-real-ip') || '';
  if (!ip) ip = 'unknown';
  return ip;
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { fingerprint, action } = body;
    var ip = getClientIp(req);
    var sb = getSupabase();
    if (!sb) return NextResponse.json({ ok: true, count: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT });

    if (action === 'check') {
      var { data, error } = await sb.from('anonymous_usage').select('message_count, fingerprint').eq('ip_address', ip).limit(1).maybeSingle();
      if (!data && fingerprint) {
        var r2 = await sb.from('anonymous_usage').select('message_count').eq('fingerprint', fingerprint).limit(1).maybeSingle();
        data = r2.data;
      }
      var count = data ? data.message_count : 0;
      return NextResponse.json({ ok: true, count: count, limit: FREE_LIMIT, remaining: Math.max(0, FREE_LIMIT - count), blocked: count >= FREE_LIMIT });
    }

    if (action === 'increment') {
      var { data: existing } = await sb.from('anonymous_usage').select('id, message_count').eq('ip_address', ip).limit(1).maybeSingle();
      if (!existing && fingerprint) {
        var r3 = await sb.from('anonymous_usage').select('id, message_count').eq('fingerprint', fingerprint).limit(1).maybeSingle();
        existing = r3.data;
      }

      if (existing) {
        var newCount = existing.message_count + 1;
        await sb.from('anonymous_usage').update({ message_count: newCount, updated_at: new Date().toISOString() }).eq('id', existing.id);
        return NextResponse.json({ ok: true, count: newCount, remaining: Math.max(0, FREE_LIMIT - newCount), blocked: newCount >= FREE_LIMIT });
      } else {
        var { data: inserted } = await sb.from('anonymous_usage').insert({ fingerprint: fingerprint || '', ip_address: ip, message_count: 1 }).select('id').single();
        return NextResponse.json({ ok: true, count: 1, remaining: FREE_LIMIT - 1, blocked: false });
      }
    }

    return NextResponse.json({ ok: false });
  } catch (err: any) {
    return NextResponse.json({ ok: true, count: 0, remaining: FREE_LIMIT, blocked: false });
  }
}

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
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { fingerprint, action } = body;
    var ip = getClientIp(req);
    var sb = getSupabase();
    if (!sb) return NextResponse.json({ ok: true, count: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT });

    var lookupKey = fingerprint || ip;

    if (action === 'check') {
      var { data } = await sb.from('anonymous_usage').select('message_count').or('fingerprint.eq.' + lookupKey + ',ip_address.eq.' + ip).single();
      var count = data ? data.message_count : 0;
      return NextResponse.json({ ok: true, count: count, limit: FREE_LIMIT, remaining: Math.max(0, FREE_LIMIT - count), blocked: count >= FREE_LIMIT });
    }

    if (action === 'increment') {
      var { data: existing } = await sb.from('anonymous_usage').select('id, message_count').or('fingerprint.eq.' + lookupKey + ',ip_address.eq.' + ip).single();

      if (existing) {
        var newCount = existing.message_count + 1;
        await sb.from('anonymous_usage').update({ message_count: newCount, updated_at: new Date().toISOString(), fingerprint: lookupKey }).eq('id', existing.id);
        return NextResponse.json({ ok: true, count: newCount, remaining: Math.max(0, FREE_LIMIT - newCount), blocked: newCount >= FREE_LIMIT });
      } else {
        await sb.from('anonymous_usage').insert({ fingerprint: lookupKey, ip_address: ip, message_count: 1 });
        return NextResponse.json({ ok: true, count: 1, remaining: FREE_LIMIT - 1, blocked: false });
      }
    }

    return NextResponse.json({ ok: false, error: 'unknown action' });
  } catch (err: any) {
    return NextResponse.json({ ok: true, count: 0, remaining: FREE_LIMIT, blocked: false });
  }
}

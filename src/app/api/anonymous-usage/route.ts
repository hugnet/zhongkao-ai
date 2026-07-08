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
    var { deviceId, action } = body;
    if (!deviceId) return NextResponse.json({ ok: false, error: 'no deviceId' });
    var sb = getSupabase();
    if (!sb) return NextResponse.json({ ok: true, count: 0, remaining: FREE_LIMIT });

    if (action === 'check') {
      var { data } = await sb.from('anonymous_usage').select('message_count').eq('fingerprint', deviceId).limit(1).maybeSingle();
      var count = data ? (data as any).message_count : 0;
      return NextResponse.json({ ok: true, count: count, remaining: Math.max(0, FREE_LIMIT - count), blocked: count >= FREE_LIMIT });
    }

    if (action === 'increment') {
      var { data: existing } = await sb.from('anonymous_usage').select('id, message_count').eq('fingerprint', deviceId).limit(1).maybeSingle();

      if (existing) {
        var newCount = (existing as any).message_count + 1;
        await sb.from('anonymous_usage').update({ message_count: newCount, updated_at: new Date().toISOString() }).eq('id', (existing as any).id);
        return NextResponse.json({ ok: true, count: newCount, remaining: Math.max(0, FREE_LIMIT - newCount), blocked: newCount >= FREE_LIMIT });
      } else {
        await sb.from('anonymous_usage').insert({ fingerprint: deviceId, ip_address: '', message_count: 1 });
        return NextResponse.json({ ok: true, count: 1, remaining: FREE_LIMIT - 1, blocked: false });
      }
    }

    return NextResponse.json({ ok: false });
  } catch (err: any) {
    return NextResponse.json({ ok: true, count: 0, remaining: FREE_LIMIT, blocked: false });
  }
}

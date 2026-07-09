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
  var historyId = req.nextUrl.searchParams.get('historyId');
  if (!userId) return NextResponse.json({ ok: false });
  var sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: true, histories: [] });

  if (historyId) {
    var result = await sb.from('chat_history').select('id, agent_id, title, messages, created_at, updated_at').eq('id', historyId).eq('user_id', userId).single();
    return NextResponse.json({ ok: true, history: result.data });
  }

  var list = await sb.from('chat_history').select('id, agent_id, title, created_at, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(50);
  return NextResponse.json({ ok: true, histories: list.data || [] });
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { userId, historyId, agentId, title, messages } = body;
    if (!userId) return NextResponse.json({ ok: false });
    var sb = getSupabase();
    if (!sb) return NextResponse.json({ ok: true });

    if (historyId) {
      await sb.from('chat_history').update({ messages: messages, title: title, updated_at: new Date().toISOString() }).eq('id', historyId).eq('user_id', userId);
      return NextResponse.json({ ok: true, id: historyId });
    } else {
      var insertResult = await sb.from('chat_history').insert({ user_id: userId, agent_id: agentId, title: title || '新对话', messages: messages }).select('id').single();
      return NextResponse.json({ ok: true, id: insertResult.data?.id });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false });
  }
}

export async function DELETE(req: NextRequest) {
  var userId = req.nextUrl.searchParams.get('userId');
  var historyId = req.nextUrl.searchParams.get('historyId');
  if (!userId || !historyId) return NextResponse.json({ ok: false });
  var sb = getSupabase();
  if (!sb) return NextResponse.json({ ok: true });
  await sb.from('chat_history').delete().eq('id', historyId).eq('user_id', userId);
  return NextResponse.json({ ok: true });
}
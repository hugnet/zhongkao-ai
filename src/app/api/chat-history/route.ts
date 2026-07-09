import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase(accessToken?: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (accessToken) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: 'Bearer ' + accessToken } },
    });
  }
  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return createClient(SUPABASE_URL, serviceKey);
  return null;
}

export async function GET(req: NextRequest) {
  var userId = req.nextUrl.searchParams.get('userId');
  var historyId = req.nextUrl.searchParams.get('historyId');
  var accessToken = req.nextUrl.searchParams.get('accessToken');
  if (!userId) return NextResponse.json({ ok: false });
  var sb = getSupabase(accessToken || undefined);
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
    var { userId, historyId, agentId, title, messages, accessToken } = body;
    if (!userId) return NextResponse.json({ ok: false });
    var sb = getSupabase(accessToken);
    if (!sb) return NextResponse.json({ ok: false, error: '数据库未配置' });

    if (historyId) {
      await sb.from('chat_history').update({ messages: messages, title: title, updated_at: new Date().toISOString() }).eq('id', historyId).eq('user_id', userId);
      return NextResponse.json({ ok: true, id: historyId });
    } else {
      var insertResult = await sb.from('chat_history').insert({ user_id: userId, agent_id: agentId, title: title || '新对话', messages: messages }).select('id').single();
      return NextResponse.json({ ok: true, id: insertResult.data?.id });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}

export async function DELETE(req: NextRequest) {
  var userId = req.nextUrl.searchParams.get('userId');
  var historyId = req.nextUrl.searchParams.get('historyId');
  var accessToken = req.nextUrl.searchParams.get('accessToken');
  if (!userId || !historyId) return NextResponse.json({ ok: false });
  var sb = getSupabase(accessToken || undefined);
  if (!sb) return NextResponse.json({ ok: true });
  await sb.from('chat_history').delete().eq('id', historyId).eq('user_id', userId);
  return NextResponse.json({ ok: true });
}
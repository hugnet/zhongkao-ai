import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function restQuery(table: string, query: string, accessToken: string) {
  var url = SUPABASE_URL + '/rest/v1/' + table + query;
  var res = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    var errText = await res.text().catch(function() { return ''; });
    console.error('[chat-history] REST query error:', res.status, errText.slice(0, 300));
    return null;
  }
  return res.json();
}

async function restInsert(table: string, body: any, accessToken: string) {
  var url = SUPABASE_URL + '/rest/v1/' + table;
  var res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    var errText = await res.text().catch(function() { return ''; });
    console.error('[chat-history] REST insert error:', res.status, errText.slice(0, 300));
    return null;
  }
  return res.json();
}

async function restUpdate(table: string, query: string, body: any, accessToken: string) {
  var url = SUPABASE_URL + '/rest/v1/' + table + query;
  var res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function restDelete(table: string, query: string, accessToken: string) {
  var url = SUPABASE_URL + '/rest/v1/' + table + query;
  var res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
  return res.ok;
}

export async function GET(req: NextRequest) {
  var userId = req.nextUrl.searchParams.get('userId');
  var historyId = req.nextUrl.searchParams.get('historyId');
  var accessToken = req.nextUrl.searchParams.get('accessToken');
  if (!userId || !accessToken) return NextResponse.json({ ok: false });

  if (historyId) {
    var row = await restQuery('chat_history', '?id=eq.' + historyId + '&user_id=eq.' + userId + '&select=id,agent_id,title,messages,created_at,updated_at', accessToken);
    return NextResponse.json({ ok: true, history: (row && row[0]) || null });
  }

  var list = await restQuery('chat_history', '?user_id=eq.' + userId + '&order=updated_at.desc&limit=50&select=id,agent_id,title,created_at,updated_at', accessToken);
  return NextResponse.json({ ok: true, histories: list || [] });
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { userId, historyId, agentId, title, messages, accessToken } = body;
    if (!userId || !accessToken) return NextResponse.json({ ok: false });

    if (historyId) {
      await restUpdate('chat_history', '?id=eq.' + historyId + '&user_id=eq.' + userId, { messages: messages, title: title, updated_at: new Date().toISOString() }, accessToken);
      return NextResponse.json({ ok: true, id: historyId });
    } else {
      var result = await restInsert('chat_history', { user_id: userId, agent_id: agentId, title: title || '新对话', messages: messages }, accessToken);
      return NextResponse.json({ ok: true, id: result && result[0] ? result[0].id : null });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}

export async function DELETE(req: NextRequest) {
  var userId = req.nextUrl.searchParams.get('userId');
  var historyId = req.nextUrl.searchParams.get('historyId');
  var accessToken = req.nextUrl.searchParams.get('accessToken');
  if (!userId || !historyId || !accessToken) return NextResponse.json({ ok: false });
  await restDelete('chat_history', '?id=eq.' + historyId + '&user_id=eq.' + userId, accessToken);
  return NextResponse.json({ ok: true });
}
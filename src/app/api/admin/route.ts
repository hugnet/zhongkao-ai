import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

function getAdminToken(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

function verifyToken(token: string): boolean {
  return token === getAdminToken();
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ ok: false, error: '未授权' });
  }

  const sb = getSupabase();
  let users: any[] = [];
  let stats = { totalUsers: 0, totalCredits: 0, totalMessages: 0 };

  if (sb) {
    const { data: profiles } = await sb.from('profiles').select('id, email, created_at');
    const { data: credits } = await sb.from('credits').select('user_id, balance');
    const { data: tx } = await sb.from('credit_transactions').select('amount, type');

    users = (profiles || []).map(function(p) {
      var c = credits?.find(function(cr) { return cr.user_id === p.id; });
      return { email: p.email, credits: c?.balance ?? 3000, created_at: p.created_at };
    });

    stats.totalUsers = users.length;
    stats.totalCredits = credits?.reduce(function(sum, c) { return sum + (c.balance || 0); }, 0) || 0;
    stats.totalMessages = (tx || []).filter(function(t) { return t.type === 'deduct'; }).length;
  }

  return NextResponse.json({ ok: true, users, stats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, password } = body;

  if (action === 'login') {
    if (password === getAdminToken()) {
      return NextResponse.json({ ok: true, token: password });
    }
    return NextResponse.json({ ok: false, error: '密码错误' });
  }

  if (!password || !verifyToken(password)) {
    return NextResponse.json({ ok: false, error: '未授权' });
  }

  if (action === 'test') {
    const apiKey = process.env.DEFAULT_API_KEY || '';
    const provider = getProvider('agnes');
    if (!apiKey) return NextResponse.json({ ok: false, error: 'DEFAULT_API_KEY未配置' });
    if (!provider) return NextResponse.json({ ok: false, error: '供应商配置错误' });

    try {
      const url = buildChatURL(provider);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: body.model || provider.model,
          messages: [{ role: 'user', content: 'Hello, reply OK' }],
          max_tokens: 10,
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(function() { return ''; });
        return NextResponse.json({ ok: false, error: 'HTTP ' + res.status + ': ' + err.slice(0, 200) });
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'No response';
      return NextResponse.json({ ok: true, message: '连接成功！模型响应: ' + reply.slice(0, 50) });
    } catch(e: any) {
      return NextResponse.json({ ok: false, error: '连接异常：' + e.message });
    }
  }

  return NextResponse.json({ ok: false, error: '未知操作' });
}
import { NextRequest, NextResponse } from 'next/server';
import { skillEngine } from '@/lib/skills/skillEngine';
import { getCredits, deductCredits, CREDITS_PER_MESSAGE } from '@/lib/credits';
import { getProvider, buildChatURL } from '@/lib/ai/providers';
import { createClient } from '@supabase/supabase-js';

var DEFAULT_PROVIDER_ID = 'agnes';
var ANON_LIMIT = 10;

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || '';
}

function getSupabase() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

async function checkAnonymousLimit(fingerprint: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!fingerprint) return { allowed: true, remaining: ANON_LIMIT };
  var sb = getSupabase();
  if (!sb) return { allowed: true, remaining: ANON_LIMIT };

  var { data } = await sb.from('anonymous_usage').select('id, message_count').eq('fingerprint', fingerprint).single();
  var count = data ? data.message_count : 0;
  return { allowed: count < ANON_LIMIT, remaining: Math.max(0, ANON_LIMIT - count) };
}

async function incrementAnonymousUsage(fingerprint: string): Promise<void> {
  if (!fingerprint) return;
  var sb = getSupabase();
  if (!sb) return;

  var { data: existing } = await sb.from('anonymous_usage').select('id, message_count').eq('fingerprint', fingerprint).single();
  if (existing) {
    await sb.from('anonymous_usage').update({ message_count: existing.message_count + 1, updated_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await sb.from('anonymous_usage').insert({ fingerprint: fingerprint, message_count: 1 });
  }
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { messages, agentId, userId, fingerprint } = body;

    var apiKey = getDefaultApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: '服务未配置，请联系管理员' }, { status: 503 });
    }

    var provider = getProvider(DEFAULT_PROVIDER_ID);
    if (!provider) {
      return NextResponse.json({ error: '配置错误' }, { status: 500 });
    }

    if (userId) {
      var credits = await getCredits(userId);
      if (credits < CREDITS_PER_MESSAGE) {
        return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', credits: credits }, { status: 402 });
      }
    } else if (fingerprint) {
      var anonCheck = await checkAnonymousLimit(fingerprint);
      if (!anonCheck.allowed) {
        return NextResponse.json({ error: 'ANON_LIMIT_EXCEEDED' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: '请登录或刷新页面重试' }, { status: 403 });
    }

    var systemPrompt = skillEngine.getSystemPrompt(agentId || 'math-tutor');
    var allMessages = [{ role: 'system', content: systemPrompt }];
    if (messages) {
      for (var i = Math.max(0, messages.length - 20); i < messages.length; i++) {
        allMessages.push(messages[i]);
      }
    }

    var url = buildChatURL(provider);
    var res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'AI服务暂时不可用' }, { status: res.status });
    }

    var data = await res.json();
    var content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '抱歉，暂时无法回答。';

    if (userId) {
      await deductCredits(userId, CREDITS_PER_MESSAGE, 'AI对话消耗');
      var remainingCredits = await getCredits(userId);
      return NextResponse.json({ content: content, credits: remainingCredits });
    } else if (fingerprint) {
      await incrementAnonymousUsage(fingerprint);
      var anonResult = await checkAnonymousLimit(fingerprint);
      return NextResponse.json({ content: content, remaining: anonResult.remaining });
    }

    return NextResponse.json({ content: content });
  } catch (err: any) {
    return NextResponse.json({ error: '服务暂时不可用' }, { status: 500 });
  }
}


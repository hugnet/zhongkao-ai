import { NextRequest, NextResponse } from 'next/server';
import { skillEngine } from '@/lib/skills/skillEngine';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { messages, agentId, apiKey, providerId } = body;
    if (!apiKey) { return NextResponse.json({ error: 'API Key 不能为空' }, { status: 400 }); }

    var provider = getProvider(providerId || 'deepseek');
    if (!provider) { return NextResponse.json({ error: '不支持的供应商: ' + providerId }, { status: 400 }); }

    var sys = skillEngine.getSystemPrompt(agentId);
    var all = [{ role: 'system', content: sys }];
    if (messages) {
      for (var i = Math.max(0, messages.length - 20); i < messages.length; i++) {
        all.push(messages[i]);
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
        messages: all,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'API error: ' + res.status + ' ' + res.statusText }, { status: res.status });
    }

    var data = await res.json();
    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || '抱歉，无法回答。',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器内部错误' }, { status: 500 });
  }
}
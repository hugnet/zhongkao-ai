import { NextRequest, NextResponse } from 'next/server';
import { skillEngine } from '@/lib/skills/skillEngine';
import { getCredits, deductCredits, CREDITS_PER_MESSAGE } from '@/lib/credits';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

const DEFAULT_PROVIDER_ID = 'agnes';

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, agentId, userId } = body;

    const apiKey = getDefaultApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: '服务未配置，请联系管理员' }, { status: 503 });
    }

    const provider = getProvider(DEFAULT_PROVIDER_ID);
    if (!provider) {
      return NextResponse.json({ error: '配置错误' }, { status: 500 });
    }

    if (userId) {
      const credits = await getCredits(userId);
      if (credits < CREDITS_PER_MESSAGE) {
        return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', credits }, { status: 402 });
      }
    }

    const systemPrompt = skillEngine.getSystemPrompt(agentId || 'math-tutor');
    const allMessages = [{ role: 'system', content: systemPrompt }];
    if (messages) {
      for (let i = Math.max(0, messages.length - 20); i < messages.length; i++) {
        allMessages.push(messages[i]);
      }
    }

    const url = buildChatURL(provider);
    const res = await fetch(url, {
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
      const errText = await res.text().catch(() => '');
      return NextResponse.json({ error: 'AI服务暂时不可用' }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '抱歉，暂时无法回答。';

    if (userId) {
      await deductCredits(userId, CREDITS_PER_MESSAGE, 'AI对话消耗');
    }

    let remainingCredits = -1;
    if (userId) {
      remainingCredits = await getCredits(userId);
    }

    return NextResponse.json({ content, credits: remainingCredits });
  } catch (err: any) {
    return NextResponse.json({ error: '服务暂时不可用' }, { status: 500 });
  }
}

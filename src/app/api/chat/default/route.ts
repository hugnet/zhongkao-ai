import { NextRequest, NextResponse } from 'next/server';
import { skillEngine } from '@/lib/skills/skillEngine';
import { getCredits, deductCredits, CREDITS_PER_MESSAGE } from '@/lib/credits';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

// 默认使用 OpenCode Zen 的免费模型
const DEFAULT_PROVIDER_ID = 'opencode-zen';
const DEFAULT_API_KEY_ENV = 'DEFAULT_API_KEY';

function getDefaultApiKey(): string {
  return process.env[DEFAULT_API_KEY_ENV] || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, agentId, userId } = body;

    const apiKey = getDefaultApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: '服务未配置默认API，请联系管理员' }, { status: 503 });
    }

    const provider = getProvider(DEFAULT_PROVIDER_ID);
    if (!provider) {
      return NextResponse.json({ error: '默认供应商配置错误' }, { status: 500 });
    }

    // Check credits
    if (userId) {
      const credits = await getCredits(userId);
      if (credits < CREDITS_PER_MESSAGE) {
        return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', credits }, { status: 402 });
      }
    }

    // Build system prompt
    const systemPrompt = skillEngine.getSystemPrompt(agentId || 'math-tutor');
    const allMessages = [{ role: 'system', content: systemPrompt }];
    if (messages) {
      for (let i = Math.max(0, messages.length - 20); i < messages.length; i++) {
        allMessages.push(messages[i]);
      }
    }

    const url = buildChatURL(provider);
    let res: Response;

    if (provider.useResponsesApi) {
      // OpenCode Zen Responses API format
      const userContent = allMessages
        .filter(m => m.role !== 'system')
        .map(m => m.content)
        .join('\n');
      const systemContent = allMessages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n');

      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: provider.model,
          input: [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent },
          ],
        }),
      });
    } else {
      // Standard OpenAI Chat Completions format
      res = await fetch(url, {
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
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({ error: 'API error: ' + res.status + ' ' + res.statusText + ' ' + errText }, { status: res.status });
    }

    const data = await res.json();
    let content = '';

    if (provider.useResponsesApi) {
      // Parse Responses API format
      if (data.output && Array.isArray(data.output)) {
        for (const item of data.output) {
          if (item.type === 'message' && item.content) {
            for (const part of item.content) {
              if (part.type === 'output_text') {
                content += part.text;
              }
            }
          }
        }
      }
      content = content || data.choices?.[0]?.message?.content || JSON.stringify(data).slice(0, 500);
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      content = '抱歉，暂时无法回答。';
    }

    // Deduct credits
    if (userId) {
      await deductCredits(userId, CREDITS_PER_MESSAGE, 'AI对话消耗');
    }

    let remainingCredits = -1;
    if (userId) {
      remainingCredits = await getCredits(userId);
    }

    return NextResponse.json({ content, credits: remainingCredits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器内部错误' }, { status: 500 });
  }
}

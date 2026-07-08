import { NextRequest, NextResponse } from 'next/server';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, apiKey, model } = body;

    const provider = getProvider(providerId || 'opencode-zen');
    if (!provider) {
      return NextResponse.json({ ok: false, error: '不支持的供应商' });
    }

    // 默认供应商使用服务端环境变量中的Key，第三方才用用户传入的Key
    const useApiKey = providerId === 'opencode-zen' ? getDefaultApiKey() : apiKey;
    if (!useApiKey) {
      return NextResponse.json({ ok: false, error: providerId === 'opencode-zen' ? '默认API未配置' : '请输入API Key' });
    }

    const testModel = model || provider.model;
    const url = buildChatURL(provider);

    let res: Response;
    const testBody = provider.useResponsesApi ? {
      model: testModel,
      input: [{ role: 'user', content: 'Hello, reply with just "OK" in one word.' }],
    } : {
      model: testModel,
      messages: [{ role: 'user', content: 'Hello, reply with just "OK" in one word.' }],
      max_tokens: 10,
    };

    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + useApiKey,
      },
      body: JSON.stringify(testBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({
        ok: false,
        error: '连接失败 (HTTP ' + res.status + '): ' + (errText.slice(0, 200) || res.statusText),
      });
    }

    const data = await res.json();
    let reply = '';

    if (provider.useResponsesApi) {
      if (data.output && Array.isArray(data.output)) {
        for (const item of data.output) {
          if (item.type === 'message' && item.content) {
            for (const part of item.content) {
              if (part.type === 'output_text') reply += part.text;
            }
          }
        }
      }
      reply = reply || JSON.stringify(data).slice(0, 100);
    } else {
      reply = data.choices?.[0]?.message?.content || JSON.stringify(data).slice(0, 100);
    }

    return NextResponse.json({
      ok: true,
      model: testModel,
      reply: reply.slice(0, 100),
      message: '连接成功！模型 ' + testModel + ' 正常响应',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: '连接异常：' + (err.message || '未知错误') });
  }
}

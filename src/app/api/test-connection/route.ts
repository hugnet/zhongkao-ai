import { NextRequest, NextResponse } from 'next/server';

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, apiKey, model, baseUrl, protocol } = body;

    let useApiKey = apiKey;
    let useBaseUrl = baseUrl;
    let useModel = model || 'gpt-4o-mini';
    let useProtocol = protocol || 'chat';

    if (providerId === 'agnes' || (!apiKey && providerId !== 'custom')) {
      useApiKey = getDefaultApiKey();
      useBaseUrl = useBaseUrl || 'https://apihub.agnes-ai.com/v1';
      useModel = useModel || 'agnes-2.0-flash';
    }

    if (!useApiKey) {
      return NextResponse.json({ ok: false, error: '请输入API Key' });
    }
    if (!useBaseUrl) {
      return NextResponse.json({ ok: false, error: '请输入Base URL' });
    }

    let url = useBaseUrl.replace(/\/$/, '');
    if (useProtocol === 'responses') {
      url += '/responses';
    } else {
      url += '/chat/completions';
    }

    let testBody: any;
    if (useProtocol === 'responses') {
      testBody = {
        model: useModel,
        input: [{ role: 'user', content: 'Hello, reply with just "OK" in one word.' }],
      };
    } else {
      testBody = {
        model: useModel,
        messages: [{ role: 'user', content: 'Hello, reply with just "OK" in one word.' }],
        max_tokens: 10,
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + useApiKey,
      },
      body: JSON.stringify(testBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let errMsg = 'HTTP ' + res.status;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errMsg += ': ' + (typeof errJson.error === 'string' ? errJson.error : errJson.error.message || JSON.stringify(errJson.error));
        else errMsg += ': ' + errText.slice(0, 150);
      } catch(e) {
        errMsg += ': ' + (errText.slice(0, 150) || res.statusText);
      }
      return NextResponse.json({ ok: false, error: errMsg });
    }

    const data = await res.json();
    let reply = '';

    if (useProtocol === 'responses') {
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
      model: useModel,
      reply: (reply || '').slice(0, 50),
      message: '连接成功！模型 ' + useModel + ' 响应正常',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: '连接异常：' + (err.message || '网络错误') });
  }
}

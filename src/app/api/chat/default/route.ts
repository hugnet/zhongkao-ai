import { NextRequest, NextResponse } from 'next/server';
import { skillEngine } from '@/lib/skills/skillEngine';
import { getCredits, deductCredits, calculateCredits } from '@/lib/credits';
import { getProvider, buildChatURL } from '@/lib/ai/providers';
import { createClient } from '@supabase/supabase-js';

var DEFAULT_PROVIDER_ID = 'agnes';

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || '';
}

function getSupabase() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    var body = await req.json();
    var { messages, agentId, userId } = body;

    var apiKey = getDefaultApiKey();
    if (!apiKey) {
      console.error('[chat/default] DEFAULT_API_KEY not set');
      return NextResponse.json({ error: '服务未配置，请联系管理员' }, { status: 503 });
    }

    var provider = getProvider(DEFAULT_PROVIDER_ID);
    if (!provider) {
      console.error('[chat/default] Provider not found:', DEFAULT_PROVIDER_ID);
      return NextResponse.json({ error: '配置错误' }, { status: 500 });
    }

    if (!userId) {
      return NextResponse.json({ error: '请先登录后再使用' }, { status: 401 });
    }

    var sb = getSupabase();
    if (sb) {
      var { data: userData } = await sb.auth.admin.getUserById(userId);
      if (!userData?.user?.email_confirmed_at) {
        return NextResponse.json({ error: '请先到邮箱确认后再使用' }, { status: 403 });
      }
    }

    var credits = await getCredits(userId);
    if (credits < 1) {
      return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', credits: credits }, { status: 402 });
    }

    var systemPrompt = skillEngine.getSystemPrompt(agentId || 'math-tutor');
    var allMessages = [{ role: 'system', content: systemPrompt }];
    if (messages) {
      for (var i = Math.max(0, messages.length - 20); i < messages.length; i++) {
        allMessages.push(messages[i]);
      }
    }

    var url = buildChatURL(provider);
    console.log('[chat/default] Requesting:', url, 'model:', provider.model);

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
      var errText = await res.text().catch(function() { return ''; });
      console.error('[chat/default] API error:', res.status, errText.slice(0, 500));
      var errMsg = 'AI服务暂时不可用';
      try {
        var errJson = JSON.parse(errText);
        if (errJson.error) {
          errMsg = typeof errJson.error === 'string' ? errJson.error : (errJson.error.message || JSON.stringify(errJson.error));
        }
      } catch(e) {
        if (errText) errMsg = errText.slice(0, 200);
      }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    var data = await res.json();
    var content = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content || '';
    }
    if (!content) {
      console.error('[chat/default] Empty response:', JSON.stringify(data).slice(0, 500));
      content = '抱歉，暂时无法回答。';
    }

    var usage = data.usage || {};
    var creditsUsed = calculateCredits(usage);
    var description = 'AI对话消耗 (输入' + (usage.prompt_tokens || 0) + ' + 输出' + (usage.completion_tokens || 0) + ' tokens)';

    var deductResult = await deductCredits(userId, creditsUsed, description);
    var remainingCredits = deductResult.success ? deductResult.balance : credits;

    return NextResponse.json({
      content: content,
      credits: remainingCredits,
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        credits_used: creditsUsed,
      },
    });
  } catch (err: any) {
    console.error('[chat/default] Exception:', err.message, err.stack);
    return NextResponse.json({ error: '服务暂时不可用：' + (err.message || '未知错误') }, { status: 500 });
  }
}
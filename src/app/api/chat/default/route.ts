import { NextRequest, NextResponse } from 'next/server';
import { skillEngine } from '@/lib/skills/skillEngine';
import { getCredits, deductCredits, calculateCredits, getUserPlan, getDailyCount, incrementDailyUsage, FREE_DAILY_LIMIT } from '@/lib/credits';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

const DEFAULT_PROVIDER_ID = 'agnes';

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, agentId, userId, accessToken } = body;

    const apiKey = getDefaultApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: '服务未配置' }, { status: 503 });
    }

    const provider = getProvider(DEFAULT_PROVIDER_ID);
    if (!provider) {
      return NextResponse.json({ error: '配置错误' }, { status: 500 });
    }

    if (!userId || !accessToken) {
      return NextResponse.json({ error: '请先登录后再使用' }, { status: 401 });
    }

    const userPlan = await getUserPlan(userId, accessToken);
    const isPremium = userPlan === 'monthly' || userPlan === 'yearly';

    // 检查每日限制
    const dailyCount = await getDailyCount(userId, accessToken);
    if (!isPremium && dailyCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json({
        error: 'DAILY_LIMIT_EXCEEDED',
        daily_count: dailyCount,
        daily_limit: FREE_DAILY_LIMIT,
      }, { status: 429 });
    }

    // 检查积分
    const credits = await getCredits(userId, accessToken);
    if (!isPremium && credits < 1) {
      return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', credits }, { status: 402 });
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
      let errText = await res.text().catch(() => '');
      let errMsg = 'AI服务暂时不可用';
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errMsg = typeof errJson.error === 'string' ? errJson.error : (errJson.error.message || 'AI服务错误');
      } catch(e) { if (errText) errMsg = errText.slice(0, 200); }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json();
    let content = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content || '';
    }
    if (!content) content = '抱歉，暂时无法回答。';

    const usage = data.usage || {};
    const creditsUsed = calculateCredits(usage);
    const description = 'AI对话 (输入' + (usage.prompt_tokens || 0) + ' + 输出' + (usage.completion_tokens || 0) + ' tokens)';

    let remainingCredits = credits;

    // 非会员扣积分
    if (!isPremium) {
      const deductResult = await deductCredits(userId, creditsUsed, description, accessToken);
      remainingCredits = deductResult.success ? deductResult.balance : credits;
    }

    // 增加每日使用次数
    const newDailyCount = await incrementDailyUsage(userId, accessToken);

    return NextResponse.json({
      content,
      credits: remainingCredits,
      plan: userPlan,
      daily_count: newDailyCount,
      daily_limit: FREE_DAILY_LIMIT,
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        credits_used: creditsUsed,
      },
    });
  } catch (err: any) {
    console.error('[chat/default] Exception:', err.message);
    return NextResponse.json({ error: '服务暂时不可用：' + (err.message || '未知错误') }, { status: 500 });
  }
}

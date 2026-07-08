import { NextRequest, NextResponse } from "next/server";
import { skillEngine } from "@/lib/skills/skillEngine";
import { getCredits, deductCredits, CREDITS_PER_MESSAGE } from "@/lib/credits";

const DEFAULT_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

function getDefaultApiKey(): string {
  return process.env.DEFAULT_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, agentId, userId } = body;

    const apiKey = getDefaultApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "服务未配置默认API" }, { status: 503 });
    }

    // Check credits (only if userId provided, otherwise allow for anonymous)
    if (userId) {
      const credits = await getCredits(userId);
      if (credits < CREDITS_PER_MESSAGE) {
        return NextResponse.json({ error: "INSUFFICIENT_CREDITS", credits }, { status: 402 });
      }
    }

    const systemPrompt = skillEngine.getSystemPrompt(agentId || "math-tutor");
    const allMessages = [{ role: "system", content: systemPrompt }];
    if (messages) {
      for (let i = Math.max(0, messages.length - 20); i < messages.length; i++) {
        allMessages.push(messages[i]);
      }
    }

    const res = await fetch(DEFAULT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "API error: " + res.status }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "抱歉，暂时无法回答。";

    // Deduct credits after successful response
    if (userId) {
      await deductCredits(userId, CREDITS_PER_MESSAGE, "AI对话消耗");
    }

    // Return with credit balance info
    let remainingCredits = -1;
    if (userId) {
      remainingCredits = await getCredits(userId);
    }

    return NextResponse.json({ content, credits: remainingCredits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器内部错误" }, { status: 500 });
  }
}

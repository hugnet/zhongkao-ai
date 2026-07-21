const INPUT_CREDITS_PER_1K = 1;
const OUTPUT_CREDITS_PER_1K = 3;
const FREE_CREDITS = 1000;
const LOW_CREDIT_THRESHOLD = 100;
const FREE_DAILY_LIMIT = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function headers(token: string) {
  return {
    "Authorization": "Bearer " + token,
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

export function calculateCredits(usage: { prompt_tokens?: number; completion_tokens?: number }): number {
  var input = usage.prompt_tokens || 0;
  var output = usage.completion_tokens || 0;
  return Math.max(Math.ceil((input / 1000) * INPUT_CREDITS_PER_1K) + Math.ceil((output / 1000) * OUTPUT_CREDITS_PER_1K), 1);
}

export async function getCredits(userId: string, accessToken: string): Promise<number> {
  if (!accessToken || !SUPABASE_URL) return FREE_CREDITS;
  try {
    var res = await fetch(SUPABASE_URL + "/rest/v1/credits?user_id=eq." + userId + "&select=balance", { headers: headers(accessToken) });
    if (res.ok) {
      var rows = await res.json();
      if (rows && rows.length > 0 && rows[0].balance != null) return rows[0].balance;
    }
    // 创建积分记录
    await fetch(SUPABASE_URL + "/rest/v1/credits", {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({ user_id: userId, balance: FREE_CREDITS }),
    });
    return FREE_CREDITS;
  } catch(e) { return FREE_CREDITS; }
}

export async function getUserPlan(userId: string, accessToken: string): Promise<string> {
  if (!accessToken || !SUPABASE_URL) return "free";
  try {
    var res = await fetch(SUPABASE_URL + "/rest/v1/subscriptions?user_id=eq." + userId + "&status=eq.active&select=plan,expires_at&order=expires_at.desc&limit=1", { headers: headers(accessToken) });
    if (res.ok) {
      var rows = await res.json();
      if (rows && rows.length > 0) {
        var sub = rows[0];
        if (!sub.expires_at || new Date(sub.expires_at) > new Date()) return sub.plan;
      }
    }
  } catch(e) {}
  return "free";
}

export async function deductCredits(userId: string, amount: number, description: string, accessToken: string): Promise<{ success: boolean; balance: number; error?: string }> {
  if (!accessToken || !SUPABASE_URL) return { success: false, balance: 0, error: "未认证" };

  try {
    // 1. 读取当前余额
    var res = await fetch(SUPABASE_URL + "/rest/v1/credits?user_id=eq." + userId + "&select=balance", { headers: headers(accessToken) });
    if (!res.ok) return { success: false, balance: 0, error: "读取余额失败" };

    var rows = await res.json();
    if (!rows || rows.length === 0) return { success: false, balance: 0, error: "无积分记录" };

    var currentBalance = rows[0].balance;
    if (currentBalance < amount) return { success: false, balance: currentBalance, error: "积分不足" };

    // 2. 扣减余额
    var newBalance = currentBalance - amount;
    var patchRes = await fetch(SUPABASE_URL + "/rest/v1/credits?user_id=eq." + userId, {
      method: "PATCH",
      headers: headers(accessToken),
      body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
    });

    if (!patchRes.ok) {
      var err = await patchRes.text().catch(function() { return ""; });
      console.error("[credits] PATCH failed:", patchRes.status, err.slice(0, 200));
      return { success: false, balance: currentBalance, error: "更新失败" };
    }

    // 3. 记录交易
    await fetch(SUPABASE_URL + "/rest/v1/credit_transactions", {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({ user_id: userId, amount: -amount, type: "deduct", description: description }),
    });

    return { success: true, balance: newBalance };
  } catch(e: any) {
    console.error("[credits] deductCredits error:", e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(userId: string, amount: number, description: string, accessToken: string): Promise<void> {
  if (!accessToken || !SUPABASE_URL) return;
  try {
    var res = await fetch(SUPABASE_URL + "/rest/v1/credits?user_id=eq." + userId + "&select=balance", { headers: headers(accessToken) });
    var rows = await res.json();
    var current = (rows && rows.length > 0) ? rows[0].balance : 0;
    var newBalance = current + amount;
    if (rows && rows.length > 0) {
      await fetch(SUPABASE_URL + "/rest/v1/credits?user_id=eq." + userId, { method: "PATCH", headers: headers(accessToken), body: JSON.stringify({ balance: newBalance }) });
    } else {
      await fetch(SUPABASE_URL + "/rest/v1/credits", { method: "POST", headers: headers(accessToken), body: JSON.stringify({ user_id: userId, balance: newBalance }) });
    }
    await fetch(SUPABASE_URL + "/rest/v1/credit_transactions", { method: "POST", headers: headers(accessToken), body: JSON.stringify({ user_id: userId, amount: amount, type: "grant", description: description }) });
  } catch(e: any) { console.error("[credits] grantCredits error:", e.message); }
}

export async function getCreditTransactions(userId: string, accessToken: string, limit = 20) {
  if (!accessToken || !SUPABASE_URL) return [];
  var res = await fetch(SUPABASE_URL + "/rest/v1/credit_transactions?user_id=eq." + userId + "&order=created_at.desc&limit=" + limit + "&select=amount,type,description,created_at", { headers: headers(accessToken) });
  if (!res.ok) return [];
  return await res.json();
}

export function isLowCredits(balance: number): boolean { return balance < LOW_CREDIT_THRESHOLD; }
export { FREE_CREDITS, LOW_CREDIT_THRESHOLD, INPUT_CREDITS_PER_1K, OUTPUT_CREDITS_PER_1K, FREE_DAILY_LIMIT };
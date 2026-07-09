const INPUT_CREDITS_PER_1K = 1;
const OUTPUT_CREDITS_PER_1K = 3;
const FREE_CREDITS = 3000;
const LOW_CREDIT_THRESHOLD = 100;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function restQuery(table: string, query: string, accessToken: string) {
  var url = SUPABASE_URL + "/rest/v1/" + table + query;
  var res = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + accessToken,
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
  });
  if (!res.ok) {
    var errText = await res.text().catch(function() { return ""; });
    console.error("[credits] REST error:", res.status, errText.slice(0, 300));
    return null;
  }
  return res.json();
}

async function restInsert(table: string, body: any, accessToken: string) {
  var url = SUPABASE_URL + "/rest/v1/" + table;
  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    var errText = await res.text().catch(function() { return ""; });
    console.error("[credits] REST insert error:", res.status, errText.slice(0, 300));
    return null;
  }
  return res.json();
}

async function restUpdate(table: string, query: string, body: any, accessToken: string) {
  var url = SUPABASE_URL + "/rest/v1/" + table + query;
  var res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    var errText = await res.text().catch(function() { return ""; });
    console.error("[credits] REST update error:", res.status, errText.slice(0, 300));
    return false;
  }
  return true;
}

export function calculateCredits(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): number {
  var inputTokens = usage.prompt_tokens || 0;
  var outputTokens = usage.completion_tokens || 0;
  var inputCredits = Math.ceil((inputTokens / 1000) * INPUT_CREDITS_PER_1K);
  var outputCredits = Math.ceil((outputTokens / 1000) * OUTPUT_CREDITS_PER_1K);
  return Math.max(inputCredits + outputCredits, 1);
}

export async function getCredits(userId: string, accessToken: string): Promise<number> {
  if (!accessToken || !SUPABASE_URL) return FREE_CREDITS;
  try {
    var rows = await restQuery("credits", "?user_id=eq." + userId + "&select=balance", accessToken);
    if (rows && rows.length > 0 && rows[0].balance !== undefined && rows[0].balance !== null) {
      return rows[0].balance;
    }
    await restInsert("credits", { user_id: userId, balance: FREE_CREDITS }, accessToken);
    return FREE_CREDITS;
  } catch(e) {
    return FREE_CREDITS;
  }
}

export async function deductCredits(userId: string, amount: number, description: string, accessToken: string): Promise<{ success: boolean; balance: number; error?: string }> {
  if (!accessToken || !SUPABASE_URL) return { success: false, balance: 0, error: "未认证" };

  try {
    var rows = await restQuery("credits", "?user_id=eq." + userId + "&select=balance", accessToken);
    var currentBalance = (rows && rows.length > 0) ? rows[0].balance : null;

    if (currentBalance === null) {
      await restInsert("credits", { user_id: userId, balance: FREE_CREDITS - amount }, accessToken);
      await restInsert("credit_transactions", { user_id: userId, amount: -amount, type: "deduct", description: description }, accessToken);
      return { success: true, balance: FREE_CREDITS - amount };
    }

    if (currentBalance < amount) {
      return { success: false, balance: currentBalance, error: "积分不足" };
    }

    var newBalance = currentBalance - amount;
    var ok = await restUpdate("credits", "?user_id=eq." + userId, { balance: newBalance, updated_at: new Date().toISOString() }, accessToken);
    if (!ok) return { success: false, balance: currentBalance, error: "更新失败" };

    await restInsert("credit_transactions", { user_id: userId, amount: -amount, type: "deduct", description: description }, accessToken);
    return { success: true, balance: newBalance };
  } catch(e: any) {
    console.error("[credits] deductCredits error:", e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(userId: string, amount: number, description: string, accessToken: string): Promise<void> {
  if (!accessToken || !SUPABASE_URL) return;
  try {
    var rows = await restQuery("credits", "?user_id=eq." + userId + "&select=balance", accessToken);
    var currentBalance = (rows && rows.length > 0) ? rows[0].balance : 0;
    var newBalance = currentBalance + amount;
    if (rows && rows.length > 0) {
      await restUpdate("credits", "?user_id=eq." + userId, { balance: newBalance, updated_at: new Date().toISOString() }, accessToken);
    } else {
      await restInsert("credits", { user_id: userId, balance: newBalance }, accessToken);
    }
    await restInsert("credit_transactions", { user_id: userId, amount, type: "grant", description }, accessToken);
  } catch(e: any) {
    console.error("[credits] grantCredits error:", e.message);
  }
}

export async function getCreditTransactions(userId: string, accessToken: string, limit = 20): Promise<{ amount: number; type: string; description: string; created_at: string }[]> {
  if (!accessToken || !SUPABASE_URL) return [];
  var rows = await restQuery("credit_transactions", "?user_id=eq." + userId + "&order=created_at.desc&limit=" + limit + "&select=amount,type,description,created_at", accessToken);
  return rows || [];
}

export function isLowCredits(balance: number): boolean {
  return balance < LOW_CREDIT_THRESHOLD;
}

export { FREE_CREDITS, LOW_CREDIT_THRESHOLD, INPUT_CREDITS_PER_1K, OUTPUT_CREDITS_PER_1K };
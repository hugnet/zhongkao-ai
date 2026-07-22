const FREE_CREDITS = 100;
const LOW_CREDIT_THRESHOLD = 100;
const FREE_DAILY_LIMIT = 30;
const INPUT_CREDITS_PER_1K = 1;
const OUTPUT_CREDITS_PER_1K = 3;

function getEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

function hdrs(token: string) {
  const env = getEnv();
  return {
    'Authorization': 'Bearer ' + token,
    'apikey': env.key,
    'Content-Type': 'application/json',
  };
}

async function rpcCall(token: string, fnName: string, params: Record<string, unknown>): Promise<any> {
  const env = getEnv();
  const res = await fetch(env.url + '/rest/v1/rpc/' + fnName, {
    method: 'POST',
    headers: hdrs(token),
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) throw new Error('RPC ' + fnName + ' failed: ' + res.status + ' ' + text.slice(0, 200));
  return text ? JSON.parse(text) : null;
}

export function calculateCredits(usage: { prompt_tokens?: number; completion_tokens?: number }): number {
  const input = usage.prompt_tokens || 0;
  const output = usage.completion_tokens || 0;
  return Math.max(Math.ceil((input / 1000) * INPUT_CREDITS_PER_1K) + Math.ceil((output / 1000) * OUTPUT_CREDITS_PER_1K), 1);
}

export async function getCredits(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return FREE_CREDITS;
  try {
    return (await rpcCall(accessToken, 'get_credits_balance', { p_user_id: userId })) ?? FREE_CREDITS;
  } catch (e: any) {
    console.error('[credits] getCredits error:', e.message);
    return FREE_CREDITS;
  }
}

export async function getUserPlan(userId: string, accessToken: string): Promise<string> {
  if (!accessToken) return 'free';
  try {
    return (await rpcCall(accessToken, 'get_user_plan', { p_user_id: userId })) || 'free';
  } catch (e) {
    return 'free';
  }
}

export async function getDailyCount(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return 0;
  try {
    return (await rpcCall(accessToken, 'get_daily_message_count', { p_user_id: userId })) ?? 0;
  } catch (e) {
    return 0;
  }
}

export async function incrementDailyUsage(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return 0;
  try {
    return (await rpcCall(accessToken, 'increment_daily_usage', { p_user_id: userId })) ?? 0;
  } catch (e) {
    return 0;
  }
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  accessToken: string
): Promise<{ success: boolean; balance: number; error?: string }> {
  if (!accessToken) return { success: false, balance: 0, error: '未认证' };
  try {
    const result = await rpcCall(accessToken, 'deduct_credits_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
    });
    const row = Array.isArray(result) ? result[0] : result;
    if (row && row.success) return { success: true, balance: row.new_balance };
    return { success: false, balance: row?.new_balance ?? 0, error: row?.error || '扣减失败' };
  } catch (e: any) {
    console.error('[credits] deductCredits error:', e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(userId: string, amount: number, description: string, accessToken: string): Promise<void> {
  if (!accessToken) return;
  try {
    await rpcCall(accessToken, 'grant_credits', { p_user_id: userId, p_amount: amount, p_description: description });
  } catch (e: any) {
    console.error('[credits] grantCredits error:', e.message);
  }
}

export async function getCreditTransactions(userId: string, accessToken: string, limit = 20) {
  // 交易记录也走 RPC（创建一个通用查询函数）
  const env = getEnv();
  if (!accessToken || !env.url) return [];
  try {
    const res = await fetch(env.url + '/rest/v1/credit_transactions?user_id=eq.' + userId + '&order=created_at.desc&limit=' + limit + '&select=amount,type,description,created_at', { headers: hdrs(accessToken) });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export function isLowCredits(balance: number): boolean { return balance < LOW_CREDIT_THRESHOLD; }
export { FREE_CREDITS, LOW_CREDIT_THRESHOLD, INPUT_CREDITS_PER_1K, OUTPUT_CREDITS_PER_1K, FREE_DAILY_LIMIT };

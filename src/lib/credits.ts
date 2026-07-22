const FREE_CREDITS = 1000;
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

function authHeaders(token: string) {
  const env = getEnv();
  return {
    'Authorization': 'Bearer ' + token,
    'apikey': env.key,
    'Content-Type': 'application/json',
  };
}

export function calculateCredits(usage: { prompt_tokens?: number; completion_tokens?: number }): number {
  const input = usage.prompt_tokens || 0;
  const output = usage.completion_tokens || 0;
  return Math.max(Math.ceil((input / 1000) * INPUT_CREDITS_PER_1K) + Math.ceil((output / 1000) * OUTPUT_CREDITS_PER_1K), 1);
}

export async function getCredits(userId: string, accessToken: string): Promise<number> {
  const env = getEnv();
  if (!accessToken || !env.url) return FREE_CREDITS;
  try {
    const res = await fetch(env.url + '/rest/v1/credits?user_id=eq.' + userId + '&select=balance', {
      headers: authHeaders(accessToken),
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].balance != null) return rows[0].balance;
    }
    return FREE_CREDITS;
  } catch (e) {
    return FREE_CREDITS;
  }
}

export async function getUserPlan(userId: string, accessToken: string): Promise<string> {
  const env = getEnv();
  if (!accessToken || !env.url) return 'free';
  try {
    const res = await fetch(env.url + '/rest/v1/subscriptions?user_id=eq.' + userId + '&status=eq.active&select=plan,expires_at&order=expires_at.desc&limit=1', {
      headers: authHeaders(accessToken),
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0) {
        const sub = rows[0];
        if (!sub.expires_at || new Date(sub.expires_at) > new Date()) return sub.plan || 'free';
      }
    }
  } catch (e) {}
  return 'free';
}

export async function getDailyCount(userId: string, accessToken: string): Promise<number> {
  const env = getEnv();
  if (!accessToken || !env.url) return 0;
  const today = new Date().toISOString().split('T')[0];
  try {
    const res = await fetch(env.url + '/rest/v1/daily_usage?user_id=eq.' + userId + '&usage_date=eq.' + today + '&select=message_count', {
      headers: authHeaders(accessToken),
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0) return rows[0].message_count ?? 0;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

export async function incrementDailyUsage(userId: string, accessToken: string): Promise<number> {
  const env = getEnv();
  if (!accessToken || !env.url) return 0;
  const today = new Date().toISOString().split('T')[0];
  const headers = authHeaders(accessToken);
  try {
    // 先查是否已有记录
    const readRes = await fetch(env.url + '/rest/v1/daily_usage?user_id=eq.' + userId + '&usage_date=eq.' + today + '&select=id,message_count', {
      headers: headers,
    });
    const rows = await readRes.json();
    if (rows && rows.length > 0) {
      const newCount = (rows[0].message_count || 0) + 1;
      await fetch(env.url + '/rest/v1/daily_usage?user_id=eq.' + userId + '&usage_date=eq.' + today, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ message_count: newCount }),
      });
      return newCount;
    } else {
      await fetch(env.url + '/rest/v1/daily_usage', {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ user_id: userId, usage_date: today, message_count: 1 }),
      });
      return 1;
    }
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
  const env = getEnv();
  if (!accessToken || !env.url) return { success: false, balance: 0, error: '未认证' };
  const headers = authHeaders(accessToken);

  try {
    // 1. 读取当前余额
    const readRes = await fetch(env.url + '/rest/v1/credits?user_id=eq.' + userId + '&select=balance', {
      headers: headers,
    });
    if (!readRes.ok) {
      const errText = await readRes.text().catch(() => '');
      console.error('[credits] READ failed:', readRes.status, errText.slice(0, 200));
      return { success: false, balance: 0, error: '读取余额失败' };
    }

    const rows = await readRes.json();
    if (!rows || rows.length === 0) return { success: false, balance: 0, error: '无积分记录' };

    const currentBalance = rows[0].balance ?? 0;
    if (currentBalance < amount) return { success: false, balance: currentBalance, error: '积分不足' };

    // 2. 更新余额（用 PATCH）
    const newBalance = currentBalance - amount;
    const patchRes = await fetch(env.url + '/rest/v1/credits?user_id=eq.' + userId, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => '');
      console.error('[credits] PATCH failed:', patchRes.status, errText.slice(0, 300));
      return { success: false, balance: currentBalance, error: 'PATCH失败 ' + patchRes.status + ': ' + errText.slice(0, 100) };
    }

    const patchRows = await patchRes.json().catch(() => null);
    console.log('[credits] PATCH success, new balance:', newBalance, 'response:', JSON.stringify(patchRows).slice(0, 200));

    // 3. 记录交易
    await fetch(env.url + '/rest/v1/credit_transactions', {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ user_id: userId, amount: -amount, type: 'deduct', description: description }),
    });

    return { success: true, balance: newBalance };
  } catch (e: any) {
    console.error('[credits] deductCredits exception:', e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(userId: string, amount: number, description: string, accessToken: string): Promise<void> {
  const env = getEnv();
  if (!accessToken || !env.url) return;
  try {
    const res = await fetch(env.url + '/rest/v1/credits?user_id=eq.' + userId + '&select=balance', { headers: authHeaders(accessToken) });
    const rows = await res.json();
    const current = (rows && rows.length > 0) ? rows[0].balance : 0;
    const newBalance = current + amount;
    if (rows && rows.length > 0) {
      await fetch(env.url + '/rest/v1/credits?user_id=eq.' + userId, { method: 'PATCH', headers: authHeaders(accessToken), body: JSON.stringify({ balance: newBalance }) });
    } else {
      await fetch(env.url + '/rest/v1/credits', { method: 'POST', headers: authHeaders(accessToken), body: JSON.stringify({ user_id: userId, balance: newBalance }) });
    }
  } catch (e: any) {
    console.error('[credits] grantCredits error:', e.message);
  }
}

export async function getCreditTransactions(userId: string, accessToken: string, limit = 20) {
  const env = getEnv();
  if (!accessToken || !env.url) return [];
  const res = await fetch(env.url + '/rest/v1/credit_transactions?user_id=eq.' + userId + '&order=created_at.desc&limit=' + limit + '&select=amount,type,description,created_at', { headers: authHeaders(accessToken) });
  if (!res.ok) return [];
  return await res.json();
}

export function isLowCredits(balance: number): boolean { return balance < LOW_CREDIT_THRESHOLD; }
export { FREE_CREDITS, LOW_CREDIT_THRESHOLD, INPUT_CREDITS_PER_1K, OUTPUT_CREDITS_PER_1K, FREE_DAILY_LIMIT };

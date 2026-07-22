import { createServerClient } from '@/lib/supabase/server';

const FREE_CREDITS = 1000;
const LOW_CREDIT_THRESHOLD = 100;
const FREE_DAILY_LIMIT = 30;
const INPUT_CREDITS_PER_1K = 1;
const OUTPUT_CREDITS_PER_1K = 3;

export function calculateCredits(usage: { prompt_tokens?: number; completion_tokens?: number }): number {
  const input = usage.prompt_tokens || 0;
  const output = usage.completion_tokens || 0;
  return Math.max(Math.ceil((input / 1000) * INPUT_CREDITS_PER_1K) + Math.ceil((output / 1000) * OUTPUT_CREDITS_PER_1K), 1);
}

export async function getCredits(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return FREE_CREDITS;
  const sb = createServerClient(accessToken);
  if (!sb) return FREE_CREDITS;
  try {
    const { data: creditData, error: creditErr } = await sb
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (!creditErr && creditData) return creditData.balance ?? FREE_CREDITS;
    return FREE_CREDITS;
  } catch (e) {
    return FREE_CREDITS;
  }
}

export async function getUserPlan(userId: string, accessToken: string): Promise<string> {
  if (!accessToken) return 'free';
  const sb = createServerClient(accessToken);
  if (!sb) return 'free';
  try {
    const { data, error } = await sb.rpc('get_user_plan', { p_user_id: userId });
    if (error) {
      console.error('[credits] get_user_plan RPC error:', error.message);
      return 'free';
    }
    return data || 'free';
  } catch (e) {
    return 'free';
  }
}

export async function getDailyCount(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return 0;
  const sb = createServerClient(accessToken);
  if (!sb) return 0;
  try {
    const { data, error } = await sb.rpc('get_daily_message_count', { p_user_id: userId });
    if (error) {
      console.error('[credits] get_daily_message_count RPC error:', error.message);
      return 0;
    }
    return data ?? 0;
  } catch (e) {
    return 0;
  }
}

export async function incrementDailyUsage(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return 0;
  const sb = createServerClient(accessToken);
  if (!sb) return 0;
  try {
    const { data, error } = await sb.rpc('increment_daily_usage', { p_user_id: userId });
    if (error) {
      console.error('[credits] increment_daily_usage RPC error:', error.message);
      return 0;
    }
    return data ?? 0;
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
  const sb = createServerClient(accessToken);
  if (!sb) return { success: false, balance: 0, error: '服务未就绪' };

  try {
    const { data, error } = await sb.rpc('deduct_credits_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
    });

    if (error) {
      console.error('[credits] deduct_credits_atomic RPC error:', error.message);
      return { success: false, balance: 0, error: 'RPC错误: ' + error.message };
    }

    const result = data && data[0] ? data[0] : data;
    if (result && result.success) {
      return { success: true, balance: result.new_balance };
    } else {
      return { success: false, balance: result?.new_balance ?? 0, error: result?.error || '扣减失败' };
    }
  } catch (e: any) {
    console.error('[credits] deductCredits exception:', e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(
  userId: string,
  amount: number,
  description: string,
  accessToken: string
): Promise<void> {
  if (!accessToken) return;
  const sb = createServerClient(accessToken);
  if (!sb) return;
  try {
    const { data } = await sb.from('credits').select('balance').eq('user_id', userId).maybeSingle();
    const current = data?.balance ?? 0;
    const newBalance = current + amount;
    if (data) {
      await sb.from('credits').update({ balance: newBalance }).eq('user_id', userId);
    } else {
      await sb.from('credits').insert({ user_id: userId, balance: newBalance });
    }
    await sb.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      type: 'grant',
      description: description,
    });
  } catch (e: any) {
    console.error('[credits] grantCredits error:', e.message);
  }
}

export async function getCreditTransactions(userId: string, accessToken: string, limit = 20) {
  if (!accessToken) return [];
  const sb = createServerClient(accessToken);
  if (!sb) return [];
  const { data } = await sb
    .from('credit_transactions')
    .select('amount,type,description,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export function isLowCredits(balance: number): boolean {
  return balance < LOW_CREDIT_THRESHOLD;
}

export { FREE_CREDITS, LOW_CREDIT_THRESHOLD, INPUT_CREDITS_PER_1K, OUTPUT_CREDITS_PER_1K, FREE_DAILY_LIMIT };

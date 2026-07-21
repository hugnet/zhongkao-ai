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
    const { data, error } = await sb
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (error || !data) {
      await sb.from('credits').insert({ user_id: userId, balance: FREE_CREDITS });
      return FREE_CREDITS;
    }
    return data.balance ?? FREE_CREDITS;
  } catch (e) {
    return FREE_CREDITS;
  }
}

export async function getUserPlan(userId: string, accessToken: string): Promise<string> {
  if (!accessToken) return 'free';
  const sb = createServerClient(accessToken);
  if (!sb) return 'free';
  try {
    const { data, error } = await sb
      .from('subscriptions')
      .select('plan, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return 'free';
    if (!data.expires_at || new Date(data.expires_at) > new Date()) {
      return data.plan || 'free';
    }
  } catch (e) {}
  return 'free';
}

export async function getDailyCount(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return 0;
  const sb = createServerClient(accessToken);
  if (!sb) return 0;
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await sb
      .from('daily_usage')
      .select('message_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();
    return data?.message_count ?? 0;
  } catch (e) {
    return 0;
  }
}

export async function incrementDailyUsage(userId: string, accessToken: string): Promise<number> {
  if (!accessToken) return 0;
  const sb = createServerClient(accessToken);
  if (!sb) return 0;
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await sb
      .from('daily_usage')
      .select('message_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();
    if (data) {
      await sb
        .from('daily_usage')
        .update({ message_count: data.message_count + 1 })
        .eq('user_id', userId)
        .eq('usage_date', today);
      return data.message_count + 1;
    } else {
      await sb
        .from('daily_usage')
        .insert({ user_id: userId, usage_date: today, message_count: 1 });
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
  if (!accessToken) return { success: false, balance: 0, error: '未认证' };
  const sb = createServerClient(accessToken);
  if (!sb) return { success: false, balance: 0, error: '服务未就绪' };

  try {
    const { data: creditRow, error: readErr } = await sb
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (readErr || !creditRow) return { success: false, balance: 0, error: '无积分记录' };

    const currentBalance = creditRow.balance ?? 0;
    if (currentBalance < amount) return { success: false, balance: currentBalance, error: '积分不足' };

    const newBalance = currentBalance - amount;
    const { error: updateErr } = await sb
      .from('credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (updateErr) {
      console.error('[credits] update failed:', updateErr.message);
      return { success: false, balance: currentBalance, error: '更新失败: ' + updateErr.message };
    }

    await sb.from('credit_transactions').insert({
      user_id: userId,
      amount: -amount,
      type: 'deduct',
      description: description,
    });

    return { success: true, balance: newBalance };
  } catch (e: any) {
    console.error('[credits] deductCredits error:', e.message);
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
    const { data } = await sb.from('credits').select('balance').eq('user_id', userId).single();
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

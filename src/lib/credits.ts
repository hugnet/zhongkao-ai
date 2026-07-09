import { createClient, SupabaseClient } from "@supabase/supabase-js";

const INPUT_CREDITS_PER_1K = 1;
const OUTPUT_CREDITS_PER_1K = 3;
const FREE_CREDITS = 3000;
const LOW_CREDIT_THRESHOLD = 100;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabaseWithToken(accessToken: string): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !accessToken) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: "Bearer " + accessToken } },
  });
}

function getSupabaseAdmin(): SupabaseClient | null {
  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SUPABASE_URL && serviceKey) {
    return createClient(SUPABASE_URL, serviceKey);
  }
  return null;
}

export function calculateCredits(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): number {
  var inputTokens = usage.prompt_tokens || 0;
  var outputTokens = usage.completion_tokens || 0;
  var inputCredits = Math.ceil((inputTokens / 1000) * INPUT_CREDITS_PER_1K);
  var outputCredits = Math.ceil((outputTokens / 1000) * OUTPUT_CREDITS_PER_1K);
  var total = inputCredits + outputCredits;
  return Math.max(total, 1);
}

export async function getCredits(userId: string, accessToken?: string): Promise<number> {
  var sb = accessToken ? getSupabaseWithToken(accessToken) : getSupabaseAdmin();
  if (!sb) return FREE_CREDITS;
  try {
    var result = await sb.from("credits").select("balance").eq("user_id", userId).single();
    var data = result.data;
    if (data?.balance !== undefined && data?.balance !== null) return data.balance;
    var insertResult = await sb.from("credits").insert({ user_id: userId, balance: FREE_CREDITS });
    if (!insertResult.error) return FREE_CREDITS;
    return FREE_CREDITS;
  } catch(e) {
    return FREE_CREDITS;
  }
}

export async function deductCredits(userId: string, amount: number, description: string, accessToken?: string): Promise<{ success: boolean; balance: number; error?: string }> {
  var sb = accessToken ? getSupabaseWithToken(accessToken) : getSupabaseAdmin();
  if (!sb) return { success: false, balance: 0, error: "数据库未配置" };

  try {
    var creditsResult = await sb.from("credits").select("balance").eq("user_id", userId).single();
    var creditsData = creditsResult.data;
    var currentBalance = creditsData?.balance;
    if (currentBalance === undefined || currentBalance === null) {
      await sb.from("credits").insert({ user_id: userId, balance: FREE_CREDITS - amount });
      await sb.from("credit_transactions").insert({ user_id: userId, amount: -amount, type: "deduct", description: description });
      return { success: true, balance: FREE_CREDITS - amount };
    }

    if (currentBalance < amount) {
      return { success: false, balance: currentBalance, error: "积分不足" };
    }

    var newBalance = currentBalance - amount;
    await sb.from("credits").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", userId);
    await sb.from("credit_transactions").insert({ user_id: userId, amount: -amount, type: "deduct", description: description });
    return { success: true, balance: newBalance };
  } catch(e: any) {
    console.error('[credits] deductCredits error:', e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(userId: string, amount: number, description: string, accessToken?: string): Promise<void> {
  var sb = accessToken ? getSupabaseWithToken(accessToken) : getSupabaseAdmin();
  if (!sb) return;

  try {
    var creditsResult = await sb.from("credits").select("balance").eq("user_id", userId).single();
    var creditsData = creditsResult.data;
    var currentBalance = creditsData?.balance ?? 0;
    var newBalance = currentBalance + amount;

    if (creditsData) {
      await sb.from("credits").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", userId);
    } else {
      await sb.from("credits").insert({ user_id: userId, balance: newBalance });
    }

    await sb.from("credit_transactions").insert({ user_id: userId, amount, type: "grant", description });
  } catch(e: any) {
    console.error('[credits] grantCredits error:', e.message);
  }
}

export async function getCreditTransactions(userId: string, limit = 20, accessToken?: string): Promise<{ amount: number; type: string; description: string; created_at: string }[]> {
  var sb = accessToken ? getSupabaseWithToken(accessToken) : getSupabaseAdmin();
  if (!sb) return [];
  var result = await sb.from("credit_transactions").select("amount, type, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return result.data || [];
}

export function isLowCredits(balance: number): boolean {
  return balance < LOW_CREDIT_THRESHOLD;
}

export { FREE_CREDITS, LOW_CREDIT_THRESHOLD, INPUT_CREDITS_PER_1K, OUTPUT_CREDITS_PER_1K };
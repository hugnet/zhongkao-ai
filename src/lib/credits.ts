import { createClient } from "@supabase/supabase-js";

const CREDITS_PER_MESSAGE = 10;
const FREE_CREDITS = 3000;
const LOW_CREDIT_THRESHOLD = 100;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getCredits(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return FREE_CREDITS;
  try {
    const { data } = await sb.from("credits").select("balance").eq("user_id", userId).single();
    if (data?.balance !== undefined && data?.balance !== null) return data.balance;
    await sb.from("credits").insert({ user_id: userId, balance: FREE_CREDITS });
    return FREE_CREDITS;
  } catch(e) {
    return FREE_CREDITS;
  }
}

export async function deductCredits(userId: string, amount: number, description: string): Promise<{ success: boolean; balance: number; error?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { success: true, balance: FREE_CREDITS };

  try {
    const { data: credits } = await sb.from("credits").select("balance").eq("user_id", userId).single();
    var currentBalance = credits?.balance;
    if (currentBalance === undefined || currentBalance === null) {
      await sb.from("credits").insert({ user_id: userId, balance: FREE_CREDITS - amount });
      await sb.from("credit_transactions").insert({ user_id: userId, amount: -amount, type: "deduct", description: description });
      return { success: true, balance: FREE_CREDITS - amount };
    }

    if (currentBalance < amount) {
      return { success: false, balance: currentBalance, error: "积分不足" };
    }

    const newBalance = currentBalance - amount;
    await sb.from("credits").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", userId);
    await sb.from("credit_transactions").insert({ user_id: userId, amount: -amount, type: "deduct", description: description });
    return { success: true, balance: newBalance };
  } catch(e: any) {
    console.error('[credits] deductCredits error:', e.message);
    return { success: false, balance: 0, error: e.message };
  }
}

export async function grantCredits(userId: string, amount: number, description: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  try {
    const { data: credits } = await sb.from("credits").select("balance").eq("user_id", userId).single();
    const currentBalance = credits?.balance ?? 0;
    const newBalance = currentBalance + amount;

    if (credits) {
      await sb.from("credits").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", userId);
    } else {
      await sb.from("credits").insert({ user_id: userId, balance: newBalance });
    }

    await sb.from("credit_transactions").insert({ user_id: userId, amount, type: "grant", description });
  } catch(e: any) {
    console.error('[credits] grantCredits error:', e.message);
  }
}

export async function getCreditTransactions(userId: string, limit = 20): Promise<{ amount: number; type: string; description: string; created_at: string }[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from("credit_transactions").select("amount, type, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return data || [];
}

export function isLowCredits(balance: number): boolean {
  return balance < LOW_CREDIT_THRESHOLD;
}

export { CREDITS_PER_MESSAGE, FREE_CREDITS, LOW_CREDIT_THRESHOLD };
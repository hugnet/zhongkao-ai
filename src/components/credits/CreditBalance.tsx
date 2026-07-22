'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface CreditBalanceProps {
  userId: string | null;
  onLowCredits?: (balance: number) => void;
}

export function CreditBalance({ userId, onLowCredits }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchBalance() {
      try {
        const sb = getSupabase();
        if (!sb) { setBalance(100); return; }
        const result = await sb.auth.getSession();
        const token = result.data?.session?.access_token;
        if (!token) { setBalance(100); return; }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        const res = await fetch(url + '/rest/v1/rpc/get_credits_balance', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'apikey': anonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ p_user_id: userId })
        });

        const data = await res.json();
        const bal = typeof data === 'number' ? data : 100;
        setBalance(bal);
        if (bal < 100 && onLowCredits) onLowCredits(bal);
      } catch {
        setBalance(100);
      }
    }

    fetchBalance();
  }, [userId, onLowCredits]);

  if (!userId || balance === null) return null;

  const color = balance < 20 ? 'text-red-500' : balance < 50 ? 'text-yellow-500' : 'text-green-600';
  const bgColor = balance < 20 ? 'bg-red-50 border-red-200' : balance < 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200';

  return (
    <div className={"relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-all " + bgColor}>
      <span className={"font-bold " + color}>{balance}</span>
      <span className="text-gray-500 text-xs">积分</span>
      {balance < 20 ? <span className="text-xs text-red-500 animate-pulse">!</span> : null}
    </div>
  );
}
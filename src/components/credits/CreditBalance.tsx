'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface CreditBalanceProps {
  userId: string | null;
  onLowCredits?: (balance: number) => void;
}

export function CreditBalance({ userId, onLowCredits }: CreditBalanceProps) {
  var [balance, setBalance] = useState<number | null>(null);

  useEffect(function() {
    if (!userId) return;
    var sb = getSupabase();
    if (!sb) { setBalance(3000); return; }
    sb.from('credits').select('balance').eq('user_id', userId).single()
      .then(function(result: any) {
        var b = result.data?.balance;
        if (b !== undefined && b !== null) {
          setBalance(b);
          if (b < 100 && onLowCredits) onLowCredits(b);
        } else {
          setBalance(3000);
        }
      })
      .catch(function() { setBalance(3000); });
  }, [userId]);

  if (!userId || balance === null) return null;

  var color = balance < 100 ? 'text-red-500' : balance < 500 ? 'text-yellow-500' : 'text-green-600';
  var bgColor = balance < 100 ? 'bg-red-50 border-red-200' : balance < 500 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200';

  return (
    <div className={"relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-all " + bgColor}>
      <span className={"font-bold " + color}>{balance}</span>
      <span className="text-gray-500 text-xs">积分</span>
      {balance < 100 ? <span className="text-xs text-red-500 animate-pulse">!</span> : null}
    </div>
  );
}
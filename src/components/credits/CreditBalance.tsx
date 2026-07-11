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
    sb.auth.getSession().then(function(result: any) {
      var token = result.data?.session?.access_token;
      if (!token) { setBalance(3000); return; }
      var url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      var anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      return fetch(url + '/rest/v1/credits?user_id=eq.' + userId + '&select=balance', {
        headers: { 'Authorization': 'Bearer ' + token, 'apikey': anonKey, 'Content-Type': 'application/json' },
      });
    }).then(function(r: any) { return r ? r.json() : null; })
      .then(function(data: any) {
        if (data && data[0]) {
          setBalance(data[0].balance);
          if (data[0].balance < 100 && onLowCredits) onLowCredits(data[0].balance);
        } else { setBalance(3000); }
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
'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface CreditBalanceProps {
  userId: string | null;
  onLowCredits?: (balance: number) => void;
}

export function CreditBalance({ userId, onLowCredits }: CreditBalanceProps) {
  var [balance, setBalance] = useState<number | null>(null);
  var [showDetails, setShowDetails] = useState(false);

  useEffect(function() {
    if (!userId) return;
    var sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(function(result: any) {
      var token = result.data?.session?.access_token || '';
      return fetch('/api/credits?userId=' + userId + '&accessToken=' + encodeURIComponent(token));
    }).then(function(r: any) { return r.json(); })
      .then(function(data: any) {
        setBalance(data.balance);
        if (data.balance < 100 && onLowCredits) {
          onLowCredits(data.balance);
        }
      })
      .catch(function() {});
  }, [userId]);

  if (!userId || balance === null) return null;

  var color = balance < 100 ? 'text-red-500' : balance < 500 ? 'text-yellow-500' : 'text-green-600';
  var bgColor = balance < 100 ? 'bg-red-50 border-red-200' : balance < 500 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200';

  return (
    <div className={"relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-all " + bgColor}
      onClick={function() { setShowDetails(!showDetails); }}>
      <span className={"font-bold " + color}>{balance}</span>
      <span className="text-gray-500 text-xs">积分</span>
      {balance < 100 ? <span className="text-xs text-red-500 animate-pulse">!</span> : null}

      {showDetails ? (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
          <div className="text-sm font-medium text-gray-900 mb-2">积分余额</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{balance}</div>
          <div className="text-xs text-gray-400 mb-3">按实际对话token消耗扣除</div>
          <div className="text-xs text-gray-500">
            {balance > 0 ? '积分充足，可正常使用' : '积分已用完，请充值'}
          </div>
          <a href="/pricing" className="block mt-3 text-center text-xs bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
            充值积分
          </a>
        </div>
      ) : null}
    </div>
  );
}
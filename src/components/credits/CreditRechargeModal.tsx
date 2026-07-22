'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CreditRechargeModalProps {
  open: boolean;
  balance: number;
  message?: string;
  onClose: () => void;
}

export function CreditRechargeModal({ open, balance, message, onClose }: CreditRechargeModalProps) {
  if (!open) return null;

  var isDailyLimit = message === 'daily_limit' || (message && message.indexOf('每日') !== -1);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
        <div className="p-6 text-center">
          <div className="text-5xl mb-4">{isDailyLimit ? '🔒' : '💰'}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isDailyLimit ? '今日对话次数已用完' : '积分不足'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isDailyLimit
              ? '免费用户每日最多30次对话，升级会员解锁无限对话次数'
              : '当前余额 ' + balance + ' 积分，积分用完后无法继续对话'}
          </p>

          <div className="space-y-3 mb-6">
            <Link href="/pricing" onClick={onClose}>
              <Button variant="primary" className="w-full">
                {isDailyLimit ? '升级会员 - 解锁无限对话' : '升级会员 - 赠送积分'}
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={onClose}>
              稍后再说
            </Button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left">
            <div className="text-xs font-semibold text-gray-700 mb-2">会员权益</div>
            <div className="space-y-1.5">
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <span className="text-blue-600">✓</span>
                <span><b>月度会员 ¥39/月</b> — 不限对话次数</span>
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <span className="text-blue-600">✓</span>
                <span><b>年度会员 ¥299/年</b> — 不限对话 + 5000积分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

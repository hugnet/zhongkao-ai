'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CreditRechargeModalProps {
  open: boolean;
  balance: number;
  onClose: () => void;
}

export function CreditRechargeModal({ open, balance, onClose }: CreditRechargeModalProps) {
  var [tab, setTab] = useState<'recharge' | 'subscribe'>('recharge');

  if (!open) return null;

  var rechargePlans = [
    { id: 'r1', credits: 10000, price: 9.9, label: '10000积分' },
    { id: 'r2', credits: 50000, price: 39.9, label: '50000积分', popular: true },
    { id: 'r3', credits: 200000, price: 99.9, label: '200000积分' },
  ];

  var subscribePlans = [
    { id: 'monthly', name: '月度会员', price: 49, period: '月', credits: 30000, features: ['赠送30000积分', '全科6位AI专家'] },
    { id: 'yearly', name: '年度会员', price: 399, period: '年', credits: 500000, features: ['赠送500000积分', '全科6位AI专家', '学情诊断', '定制冲刺计划'], popular: true },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">积分不足</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            当前余额 <span className="font-bold text-red-500">{balance}</span> 积分。
          </p>

          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button onClick={function() { setTab('recharge'); }}
              className={"flex-1 py-2 text-sm font-medium border-b-2 transition-colors " + (tab === 'recharge' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>
              充值积分
            </button>
            <button onClick={function() { setTab('subscribe'); }}
              className={"flex-1 py-2 text-sm font-medium border-b-2 transition-colors " + (tab === 'subscribe' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>
              开通会员
            </button>
          </div>

          {tab === 'recharge' ? (
            <div className="space-y-3">
              {rechargePlans.map(function(plan) {
                return (
                  <div key={plan.id} className={"relative flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-500 " + (plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200')}>
                    {plan.popular ? <span className="absolute -top-2 right-4 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">推荐</span> : null}
                    <div>
                      <div className="font-bold text-gray-900">{plan.label}</div>
                      <div className="text-xs text-gray-500">按token实际消耗使用</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">&yen;{plan.price}</div>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-400 text-center mt-2">支付功能开发中，敬请期待</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscribePlans.map(function(plan) {
                return (
                  <div key={plan.id} className={"relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-500 " + (plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200')}>
                    {plan.popular ? <span className="absolute -top-2 right-4 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">性价比最高</span> : null}
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">{plan.name}</div>
                      <div className="font-bold text-blue-600">&yen;{plan.price}<span className="text-xs text-gray-500">/{plan.period}</span></div>
                    </div>
                    <div className="text-sm font-bold text-blue-600 mb-2">赠送 {plan.credits.toLocaleString()} 积分</div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.features.map(function(f, i) {
                        return <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">&#10003; {f}</span>;
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-400 text-center mt-2">支付功能开发中，敬请期待</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
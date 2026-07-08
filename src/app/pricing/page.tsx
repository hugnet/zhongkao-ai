'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PricingPage() {
  var creditPlans = [
    { id: 'free', credits: 5000, price: 0, label: '新用户赠送', desc: '注册即送', perMsg: '约500次对话', popular: false },
    { id: 'r1', credits: 1000, price: 9.9, label: '1000积分', desc: '轻度使用', perMsg: '约100次对话', popular: false },
    { id: 'r2', credits: 5000, price: 39.9, label: '5000积分', desc: '常用推荐', perMsg: '约500次对话', popular: true },
    { id: 'r3', credits: 10000, price: 69.9, label: '10000积分', desc: '重度使用', perMsg: '约1000次对话', popular: false },
  ];

  var memberPlans = [
    { id: 'monthly', name: '月卡', price: 49, period: '月', features: ['无限次AI对话', '全科6位AI专家', '技能地图', '学情诊断'], popular: false },
    { id: 'yearly', name: '年卡', price: 399, period: '年', features: ['无限次AI对话', '全科6位AI专家', '技能地图', '学情诊断', '定制冲刺计划', '优先更新'], popular: true },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">选择适合的方案</h1>
        <p className="text-gray-500">比线下私教便宜100倍，却拥有24小时在线的专家团队</p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">积分充值</h2>
        <p className="text-gray-500 mb-6">按次付费，用多少充多少。新用户免费赠送5000积分。</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {creditPlans.map(function(plan) {
            return (
              <Card key={plan.id} className={"relative text-center " + (plan.popular ? "ring-2 ring-blue-500 shadow-lg" : "") + (plan.price === 0 ? "bg-green-50 border-green-200" : "")}>
                {plan.popular ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">推荐</div> : null}
                {plan.price === 0 ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">免费</div> : null}
                <CardContent className="p-5">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{plan.label}</div>
                  <div className="text-xs text-gray-500 mb-3">{plan.desc}</div>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900">{plan.price === 0 ? "免费" : "\u00A5" + plan.price}</span>
                  </div>
                  <div className="text-xs text-blue-600 font-medium mb-4">{plan.perMsg}</div>
                  <div className="text-xs text-green-600 mb-3">每次对话仅10积分</div>
                  <Link href="/chat">
                    <Button variant={plan.popular ? "primary" : "outline"} className="w-full" size="sm">
                      {plan.price === 0 ? "立即领取" : "充值"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">会员订阅</h2>
        <p className="text-gray-500 mb-6">不限次数，畅享所有AI专家服务。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {memberPlans.map(function(plan) {
            return (
              <Card key={plan.id} className={"relative text-center " + (plan.popular ? "ring-2 ring-blue-500 shadow-lg scale-105" : "")}>
                {plan.popular ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">性价比最高</div> : null}
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
                  <div className="my-4">
                    <span className="text-5xl font-bold text-gray-900">{"\u00A5"}{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8">
                    {plan.features.map(function(f, i) {
                      return <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-green-500 mt-0.5">&#10003;</span>{f}</li>;
                    })}
                  </ul>
                  <Link href="/login">
                    <Button variant={plan.popular ? "primary" : "outline"} className="w-full">{"订阅" + plan.name}</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-12 p-6 bg-gray-50 rounded-2xl">
        <h3 className="font-bold text-gray-900 mb-2">不确定选哪个？</h3>
        <p className="text-sm text-gray-500 mb-4">注册即送5000积分，先体验再决定。或使用自己的API Key完全免费。</p>
        <Link href="/chat">
          <Button variant="primary">免费开始体验</Button>
        </Link>
      </div>
    </div>
  );
}

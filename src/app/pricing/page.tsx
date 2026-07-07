'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PRICING_PLANS } from '@/lib/constants';

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">选择适合的方案</h1>
        <p className="text-gray-500">比线下私教便宜100倍，却拥有24小时在线的专家团队</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map(function(plan) {
          return (
            <Card key={plan.id} className={"relative text-center " + (plan.popular ? "ring-2 ring-blue-500 shadow-lg scale-105" : "")}>
              {plan.popular ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">最受欢迎</div> : null}
              <CardContent className="p-6">
                <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-2 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price === 0 ? "免费" : "¥" + plan.price}</span>
                  {plan.price > 0 ? <span className="text-gray-500">/{plan.period}</span> : null}
                </div>
                <ul className="text-left space-y-3 mb-8">
                  {plan.features.map(function(f, i) {
                    return <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{f}</li>;
                  })}
                </ul>
                <Link href={plan.price === 0 ? "/chat" : "/login"}>
                  <Button variant={plan.popular ? "primary" : "outline"} className="w-full">{plan.price === 0 ? "免费体验" : "订阅" + plan.name}</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
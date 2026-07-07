'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AGENTS, SUBJECTS, PRICING_PLANS } from '@/lib/constants';

export default function Home() {
  return (
    <div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          🎯 6 位 AI 专家 · 55 个核心技能
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          你的专属<span className="text-blue-600">中考提分私教</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          算无遗、力拔山、化生慧、文心雕、语通衢、策无遗——6位AI专家24小时在线，
          用55个蒸馏技能帮你系统突破中考各科压轴难关
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/chat">
            <Button variant="primary" size="lg">免费开始提问 →</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">查看定价</Button>
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">免费体验每日3次提问 · 无需注册</p>
      </section>

      {/* Expert Team Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">你的 AI 专家团队</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            每位专家都经过系统性训练，掌握对应学科的全部核心技能
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AGENTS.map(function(agent) {
              return (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{agent.avatar}</div>
                    <h3 className="font-bold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-blue-600 font-medium mb-2">{agent.title}</p>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                      {agent.skills.slice(0, 4).map(function(s) {
                        return <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.name.slice(0, 8)}..</span>;
                      })}
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">+{agent.skills.length - 4}个</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Skills Showcase */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">55 个核心技能地图</h2>
          <p className="text-gray-500 text-center mb-12">每个技能都是一套可执行的解题方法论</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBJECTS.map(function(sub) {
              var agent = AGENTS.find(function(a) { return a.id === sub.agentId; });
              return (
                <Card key={sub.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{sub.icon}</span>
                      <h3 className="font-bold text-gray-900">{sub.label}</h3>
                      <span className="text-xs text-gray-400 ml-auto">{agent?.skills.length || 0}个技能</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(agent?.skills || []).map(function(s) {
                        return <span key={s.id} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">{s.name}</span>;
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">简单透明的定价</h2>
          <p className="text-gray-500 text-center mb-12">比线下私教便宜100倍，却拥有24小时在线的专家团队</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING_PLANS.map(function(plan) {
              return (
                <Card key={plan.id} className={"relative " + (plan.popular ? "ring-2 ring-blue-500 shadow-lg scale-105" : "")}>
                  {plan.popular ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">最受欢迎</div> : null}
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price === 0 ? "免费" : "¥" + plan.price}</span>
                      {plan.price > 0 ? <span className="text-gray-500 text-sm">/{plan.period}</span> : null}
                    </div>
                    <ul className="text-left space-y-2 mb-6">
                      {plan.features.map(function(f, i) { return <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>; })}
                    </ul>
                    <Link href={plan.price === 0 ? "/chat" : "/login"}>
                      <Button variant={plan.popular ? "primary" : "outline"} className="w-full">{plan.price === 0 ? "免费体验" : "立即订阅"}</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">现在就试试你的 AI 私教</h2>
          <p className="text-blue-100 mb-8">不用预约、不用排队、随时提问</p>
          <Link href="/chat">
            <Button variant="primary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50">开始免费提问 →</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p className="mb-2">中考提分 AI 私教 · 6位专家助力中考冲刺</p>
          <p>基于 DeepSeek 大模型 · 海外服务器 · 数据加密传输</p>
        </div>
      </footer>
    </div>
  );
}
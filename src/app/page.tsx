'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AGENTS, SUBJECTS } from '@/lib/constants';

export default function Home() {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          &#127919; 6位AI专家 · 55个核心技能 · 免费使用
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          你的专属<span className="text-blue-600">中考提分私教</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          算无遗、力拔山、化生慧、文心雕、语通巧、策无遗 - 6位AI专家24小时在线，用55个蒸馏技能帮你系统突破中考各科压轴难关。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/chat">
            <Button variant="primary" size="lg">免费开始提问 &rarr;</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">查看定价</Button>
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">注册送3000积分 · 按实际token消耗扣除 · 无需API Key</p>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">三步开始，零门槛</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">1</div>
              <h3 className="font-bold text-gray-900 mb-1">选择学科</h3>
              <p className="text-sm text-gray-500">数学、物理、化学、英语、语文、学习方法</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">2</div>
              <h3 className="font-bold text-gray-900 mb-1">直接提问</h3>
              <p className="text-sm text-gray-500">无需API Key，注册即送积分，开箱即用</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">3</div>
              <h3 className="font-bold text-gray-900 mb-1">系统提分</h3>
              <p className="text-sm text-gray-500">AI专家用技能方法论一步步引导解题</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">你的 AI 专家团队</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">每位专家都经过系统性训练，掌握对应学科的全部核心技能</p>
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

      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">积分定价，透明简单</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-1">3000</div>
              <div className="text-sm text-gray-600 mb-2">免费赠送积分</div>
              <div className="text-xs text-gray-400">注册即得，按token实际消耗使用</div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-1">按量</div>
              <div className="text-sm text-gray-600 mb-2">按token实际消耗扣除</div>
              <div className="text-xs text-gray-400">输入1积分/千token + 输出3积分/千token</div>
            </div>
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-1">&infin;</div>
              <div className="text-sm text-gray-600 mb-2">会员赠送大量积分</div>
              <div className="text-xs text-gray-400">月卡49元送3万/年卡399元送50万</div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link href="/pricing"><Button variant="primary">查看全部方案</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">现在就试试你的 AI 私教</h2>
          <p className="text-blue-100 mb-8">不用预约、不用排队，随时提问</p>
          <Link href="/chat">
            <Button variant="primary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50">开始免费提问 &rarr;</Button>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p className="mb-2">中考提分 AI 私教 · 6位专家助力中考冲刺</p>
          <p>基于 AI大模型 · 海外服务器 · 数据加密传输</p>
        </div>
      </footer>
    </div>
  );
}
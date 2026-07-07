'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AGENTS, SUBJECTS } from '@/lib/constants';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SkillsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">55 个核心技能地图</h1>
        <p className="text-gray-500 max-w-xl mx-auto">每个技能都是一套经过验证的解题方法论，覆盖中考全部重点题型</p>
      </div>
      {SUBJECTS.map(function(sub) {
        var agent = AGENTS.find(function(a) { return a.id === sub.agentId; });
        return (
          <div key={sub.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{sub.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{agent?.name} · {agent?.title}</h2>
                <p className="text-sm text-gray-500">{agent?.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agent?.skills || []).map(function(s) {
                return (
                  <Card key={s.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{s.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.tags.map(function(t, i) {
                          return <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{t}</span>;
                        })}
                      </div>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-blue-600">查看解题步骤</summary>
                        <ol className="mt-2 space-y-1 pl-4 list-decimal">
                          {s.steps.map(function(step, i) { return <li key={i}>{step}</li>; })}
                        </ol>
                      </details>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="text-center mt-8">
        <Link href="/chat">
          <Button variant="primary" size="lg">开始练习 →</Button>
        </Link>
      </div>
    </div>
  );
}
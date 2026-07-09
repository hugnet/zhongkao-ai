'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DiagnosisPage() {
  var [scores, setScores] = useState<Record<string, string>>({ math:'', physics:'', chemistry:'', chinese:'', english:'' });
  var [targets, setTargets] = useState<Record<string, string>>({ math:'', physics:'', chemistry:'', chinese:'', english:'' });
  var [userId, setUserId] = useState('');
  var [report, setReport] = useState('');
  var [loading, setLoading] = useState(false);

  var subjects = [["math","数学"],["physics","物理"],["chemistry","化学"],["chinese","语文"],["english","英语"]];

  useEffect(function() {
    var stored = localStorage.getItem('zhongkao_user_id');
    if (stored) setUserId(stored);
  }, []);

  async function handleGenerate() {
    if (!userId) { window.location.href = '/login'; return; }
    setLoading(true);
    setReport("");
    try {
      var res = await fetch('/api/chat/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'generate_diagnosis' }],
          agentId: 'study-method-tutor',
          userId: userId,
        }),
      });
      var data = await res.json();
      if (data.error === 'INSUFFICIENT_CREDITS') {
        setReport("积分不足，请充值后使用此功能。");
      } else if (data.error) {
        setReport("生成失败：" + data.error);
      } else {
        setReport(data.content);
      }
    } catch (err: any) {
      setReport("生成失败：" + (err.message || "请稍后再试"));
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">学情诊断</h1>
      <p className="text-gray-500 mb-8">输入各科成绩，AI 为你生成个性化冲刺计划（按token消耗积分）</p>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">当前成绩</h3>
              {subjects.map(function(pair) {
                var key = pair[0], label = pair[1];
                return (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 w-12">{label}</span>
                    <input type="number" value={scores[key]} onChange={function(e) { setScores(function(p) { var n = Object.assign({}, p); n[key] = e.target.value; return n; }); }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" min="0" max="120" />
                    <span className="text-xs text-gray-400">分</span>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">目标成绩</h3>
              {subjects.map(function(pair) {
                var key = pair[0], label = pair[1];
                return (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 w-12">{label}</span>
                    <input type="number" value={targets[key]} onChange={function(e) { setTargets(function(p) { var n = Object.assign({}, p); n[key] = e.target.value; return n; }); }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" min="0" max="120" />
                    <span className="text-xs text-gray-400">分</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">距中考月数</label>
            <input type="number" value={userId ? '6' : ''} placeholder="6" disabled className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50" />
          </div>
          <Button variant="primary" onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "AI 正在分析..." : "生成诊断报告"}
          </Button>
        </CardContent>
      </Card>

      {report ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-900 mb-3">诊断报告</h2>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {report}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
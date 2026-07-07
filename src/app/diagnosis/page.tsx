'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generateDiagnosis } from '@/lib/ai/chat';
import { PROVIDERS } from '@/lib/ai/providers';

export default function DiagnosisPage() {
  var [scores, setScores] = useState<Record<string, string>>({ math:'', physics:'', chemistry:'', chinese:'', english:'' });
  var [targets, setTargets] = useState<Record<string, string>>({ math:'', physics:'', chemistry:'', chinese:'', english:'' });
  var [months, setMonths] = useState('6');
  var [apiKey, setApiKey] = useState('');
  var [providerId, setProviderId] = useState('glm');
  var [report, setReport] = useState('');
  var [loading, setLoading] = useState(false);

  var subjects = [["math","数学"],["physics","物理"],["chemistry","化学"],["chinese","语文"],["english","英语"]];
  var provider = PROVIDERS.find(function(p) { return p.id === providerId; });

  async function handleGenerate() {
    setLoading(true);
    setReport("");
    if (!apiKey) { setReport("请先输入API Key"); setLoading(false); return; }
    var scoreNums: Record<string, number> = {};
    var targetNums: Record<string, number> = {};
    for (var [key] of subjects) {
      scoreNums[key] = parseInt(scores[key]) || 0;
      targetNums[key] = parseInt(targets[key]) || 0;
    }
    try {
      var result = await generateDiagnosis(scoreNums, targetNums, parseInt(months) || 6, apiKey, providerId);
      setReport(result);
    } catch (err: any) {
      setReport("生成失败：" + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">学情诊断</h1>
      <p className="text-gray-500 mb-8">输入各科成绩，AI 为你生成个性化冲刺计划</p>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">当前成绩</h3>
              {subjects.map(function([key, label]) {
                return (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 w-12">{label}</span>
                    <input type="number" value={scores[key]} onChange={function(e) { setScores(function(p) { return {...p, [key]: e.target.value}; }); }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" min="0" max="120" />
                    <span className="text-xs text-gray-400">分</span>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">目标成绩</h3>
              {subjects.map(function([key, label]) {
                return (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 w-12">{label}</span>
                    <input type="number" value={targets[key]} onChange={function(e) { setTargets(function(p) { return {...p, [key]: e.target.value}; }); }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" min="0" max="120" />
                    <span className="text-xs text-gray-400">分</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">距离中考</span>
            <input type="number" value={months} onChange={function(e) { setMonths(e.target.value); }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min="1" max="12" />
            <span className="text-sm text-gray-600">个月</span>
          </div>

          {/* Provider + API Key */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">AI 供应商</h4>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map(function(p) {
                return (
                  <button
                    key={p.id}
                    onClick={function() { setProviderId(p.id); }}
                    className={"text-xs px-3 py-1.5 rounded-lg border transition-all " +
                      (providerId === p.id ? "bg-green-50 border-green-300 text-green-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300")}
                  >{p.name}</button>
                );
              })}
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={function(e) { setApiKey(e.target.value); }}
              placeholder={provider?.apiKeyHint || "输入API Key"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">{provider?.name + "：" + provider?.freeTier}</p>
          </div>

          <Button variant="primary" onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "生成中..." : "生成诊断报告"}
          </Button>
        </CardContent>
      </Card>
      {report ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">诊断报告</h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report}</div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
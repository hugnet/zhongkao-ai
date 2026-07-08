'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditBalance } from '@/components/credits/CreditBalance';

export default function SettingsPage() {
  var [userId, setUserId] = useState('');
  var [customApiKey, setCustomApiKey] = useState('');
  var [customProvider, setCustomProvider] = useState('deepseek');
  var [useDefaultApi, setUseDefaultApi] = useState(true);
  var [saved, setSaved] = useState(false);
  var [loading, setLoading] = useState(false);

  useEffect(function() {
    var stored = localStorage.getItem('zhongkao_user_id');
    if (stored) {
      setUserId(stored);
      fetchSettings(stored);
    }
  }, []);

  async function fetchSettings(uid: string) {
    try {
      var res = await fetch('/api/settings?userId=' + uid);
      var data = await res.json();
      if (data.settings) {
        setCustomApiKey(data.settings.customApiKey || '');
        setCustomProvider(data.settings.customProviderId || 'deepseek');
        setUseDefaultApi(data.settings.useDefaultApi !== false);
      }
    } catch(e) {}
  }

  async function handleSave() {
    if (!userId) return;
    setLoading(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          customApiKey: customApiKey,
          customProviderId: customProvider,
          useDefaultApi: useDefaultApi,
        }),
      });
      setSaved(true);
      setTimeout(function() { setSaved(false); }, 2000);
    } catch(e) {}
    setLoading(false);
  }

  var providers = [
    { id: 'deepseek', name: 'DeepSeek', hint: 'sk-...' },
    { id: 'qwen', name: '通义千问', hint: 'sk-...' },
    { id: 'glm', name: '智谱GLM', hint: 'xxx.xxx' },
    { id: 'sensenova', name: '商汤日日新', hint: 'sk-...' },
    { id: 'openai', name: 'OpenAI', hint: 'sk-...' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
      <p className="text-gray-500 mb-8">管理你的积分和API配置</p>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>积分余额</CardTitle>
          </CardHeader>
          <CardContent>
            {userId ? (
              <div>
                <CreditBalance userId={userId} />
                <p className="text-xs text-gray-400 mt-2">每次AI对话消耗10积分，新用户赠送5000积分</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">请先登录后查看积分</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI 模型配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg">&#9733;</div>
              <div>
                <div className="text-sm font-medium text-gray-900">使用平台默认API</div>
                <div className="text-xs text-gray-500">免费赠送积分，无需配置，开箱即用</div>
              </div>
              <label className="ml-auto relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={useDefaultApi} onChange={function(e) { setUseDefaultApi(e.target.checked); }} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {!useDefaultApi ? (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-gray-600">使用自己的第三方API Key（不消耗积分）</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择供应商</label>
                  <div className="flex flex-wrap gap-2">
                    {providers.map(function(p) {
                      return (
                        <button key={p.id} onClick={function() { setCustomProvider(p.id); }}
                          className={"px-3 py-1.5 rounded-lg text-sm transition-all " + (customProvider === p.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input type="password" value={customApiKey} onChange={function(e) { setCustomApiKey(e.target.value); }}
                    placeholder="输入你的API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">你的API Key仅保存在本地浏览器中</p>
                </div>
              </div>
            ) : null}
            <div className="pt-2">
              <Button variant="primary" onClick={handleSave} disabled={loading || !userId}>
                {saved ? "已保存 ✓" : loading ? "保存中..." : "保存设置"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>积分说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>- 新用户注册自动赠送 <span className="font-bold text-blue-600">5000积分</span></p>
              <p>- 每次AI对话消耗 <span className="font-bold">10积分</span></p>
              <p>- 5000积分可免费对话约 <span className="font-bold">500次</span></p>
              <p>- 使用自己的API Key不消耗积分</p>
              <p>- 开通会员享无限次对话</p>
              <p>- 积分用完可单独充值或开通会员</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditBalance } from '@/components/credits/CreditBalance';

interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  protocol: 'chat' | 'responses';
}

var EMPTY_CONFIG: ProviderConfig = { id: 'custom', name: '', baseUrl: '', apiKey: '', model: '', protocol: 'chat' };

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  var uid = localStorage.getItem('zhongkao_user_id') || '';
  return uid.length > 0 && uid.indexOf('anon_') !== 0;
}

export default function SettingsPage() {
  var [userId, setUserId] = useState('');
  var [config, setConfig] = useState<ProviderConfig>(EMPTY_CONFIG);
  var [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  var [testLoading, setTestLoading] = useState(false);
  var [saved, setSaved] = useState(false);
  var [loading, setLoading] = useState(false);
  var [loggedIn, setLoggedIn] = useState(false);

  useEffect(function() {
    setLoggedIn(isLoggedIn());
    var stored = localStorage.getItem('zhongkao_user_id');
    if (stored) setUserId(stored);
    try {
      var saved_config = localStorage.getItem('zhongkao_custom_provider_config');
      if (saved_config) {
        setConfig(JSON.parse(saved_config));
      }
    } catch(e) {}
  }, []);

  function updateConfig(field: keyof ProviderConfig, value: string) {
    setConfig(function(prev) { return { ...prev, [field]: value }; });
  }

  async function handleTestConnection() {
    setTestLoading(true);
    setTestResult(null);
    try {
      var res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'custom',
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
          protocol: config.protocol,
        }),
      });
      var data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? data.message : data.error });
    } catch(e: any) {
      setTestResult({ ok: false, msg: '请求失败：' + e.message });
    }
    setTestLoading(false);
  }

  function handleSave() {
    setLoading(true);
    localStorage.setItem('zhongkao_custom_provider_config', JSON.stringify(config));
    if (config.apiKey) {
      localStorage.setItem('zhongkao_custom_api_key', config.apiKey);
      localStorage.setItem('zhongkao_custom_provider', 'custom');
    } else {
      localStorage.removeItem('zhongkao_custom_api_key');
      localStorage.removeItem('zhongkao_custom_provider');
    }
    setSaved(true);
    setTimeout(function() { setSaved(false); }, 2000);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">我的设置</h1>
      <p className="text-gray-500 mb-8">管理个人信息和AI配置</p>

      <Card className="mb-6">
        <CardHeader><CardTitle>账户信息</CardTitle></CardHeader>
        <CardContent>
          {loggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">用户ID</span>
                <span className="text-sm text-gray-900 font-mono">{userId.slice(0, 16)}...</span>
              </div>
              <CreditBalance userId={userId || null} />
              <div className="text-xs text-gray-400">每次对话消耗10积分</div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">登录后可管理个人设置和配置API</p>
              <a href="/login"><Button variant="primary">登录 / 注册</Button></a>
            </div>
          )}
        </CardContent>
      </Card>

      {loggedIn ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>第三方API配置</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-xs text-gray-500">配置自己的API Key后，对话将使用你的API，不消耗平台积分。</p>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Base URL</label>
                <input value={config.baseUrl} onChange={function(e) { updateConfig('baseUrl', e.target.value); }}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">API Key</label>
                <input type="password" value={config.apiKey} onChange={function(e) { updateConfig('apiKey', e.target.value); }}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">模型名称</label>
                  <input value={config.model} onChange={function(e) { updateConfig('model', e.target.value); }}
                    placeholder="例如：gpt-4o-mini"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">接口协议</label>
                  <select value={config.protocol} onChange={function(e) { updateConfig('protocol', e.target.value as 'chat' | 'responses'); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="chat">Chat Completions</option>
                    <option value="responses">Responses API</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="primary" size="sm" onClick={handleTestConnection} disabled={testLoading || !config.apiKey || !config.baseUrl}>
                  {testLoading ? "测试中..." : "测试连接"}
                </Button>
              </div>

              {testResult ? (
                <div className={"p-2.5 rounded-lg text-xs " + (testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
                  {testResult.ok ? "✓ " : "✗ "}{testResult.msg}
                </div>
              ) : null}

              <div className="pt-2">
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                  {saved ? "已保存 ✓" : loading ? "保存中..." : "保存设置"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">登录后可配置自己的第三方API Key</p>
            <a href="/login"><Button variant="primary">登录 / 注册</Button></a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>积分说明</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>- 注册即赠 <span className="font-bold text-blue-600">3000积分</span></p>
            <p>- 每次对话消耗 <span className="font-bold">10积分</span>，约300次对话</p>
            <p>- 配置自己的API Key后对话不消耗积分</p>
            <p>- 开通会员享无限次对话</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
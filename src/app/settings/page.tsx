'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { PROVIDERS } from '@/lib/ai/providers';

interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  protocol: 'chat' | 'responses';
}

var DEFAULT_CONFIGS: Record<string, ProviderConfig> = {
  deepseek: { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', apiKey: '', model: 'deepseek-chat', protocol: 'chat' },
  qwen: { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: '', model: 'qwen-turbo', protocol: 'chat' },
  glm: { id: 'glm', name: '智谱GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '', model: 'glm-4-flash', protocol: 'chat' },
  sensenova: { id: 'sensenova', name: '商汤日日新', baseUrl: 'https://api.sensenova.cn/v1', apiKey: '', model: 'SenseChat-5', protocol: 'chat' },
  openai: { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', protocol: 'chat' },
  custom: { id: 'custom', name: '自定义', baseUrl: '', apiKey: '', model: '', protocol: 'chat' },
};

function loadConfigs(): Record<string, ProviderConfig> {
  if (typeof window === 'undefined') return DEFAULT_CONFIGS;
  try {
    var saved = localStorage.getItem('zhongkao_provider_configs');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return DEFAULT_CONFIGS;
}

function saveConfigs(configs: Record<string, ProviderConfig>) {
  localStorage.setItem('zhongkao_provider_configs', JSON.stringify(configs));
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  var uid = localStorage.getItem('zhongkao_user_id') || '';
  return uid.indexOf('anon_') !== 0;
}

export default function SettingsPage() {
  var [userId, setUserId] = useState('');
  var [useDefaultApi, setUseDefaultApi] = useState(true);
  var [selectedProvider, setSelectedProvider] = useState('deepseek');
  var [configs, setConfigs] = useState<Record<string, ProviderConfig>>(DEFAULT_CONFIGS);
  var [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  var [testLoading, setTestLoading] = useState(false);
  var [saved, setSaved] = useState(false);
  var [loading, setLoading] = useState(false);
  var [loggedIn, setLoggedIn] = useState(false);

  useEffect(function() {
    setLoggedIn(isLoggedIn());
    var stored = localStorage.getItem('zhongkao_user_id');
    if (stored) setUserId(stored);
    setConfigs(loadConfigs());
    var useDefault = localStorage.getItem('zhongkao_use_default_api');
    setUseDefaultApi(useDefault !== 'false');
    var sel = localStorage.getItem('zhongkao_selected_provider') || 'deepseek';
    setSelectedProvider(sel);
  }, []);

  var current = configs[selectedProvider] || configs.custom;

  function updateConfig(id: string, field: keyof ProviderConfig, value: string) {
    var updated = { ...configs };
    updated[id] = { ...updated[id], [field]: value };
    setConfigs(updated);
  }

  async function handleTestConnection() {
    setTestLoading(true);
    setTestResult(null);
    try {
      var res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: current.id,
          apiKey: current.apiKey,
          model: current.model,
          baseUrl: current.baseUrl,
          protocol: current.protocol,
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
    saveConfigs(configs);
    localStorage.setItem('zhongkao_custom_api_key', current.apiKey);
    localStorage.setItem('zhongkao_custom_provider', current.id);
    localStorage.setItem('zhongkao_use_default_api', String(useDefaultApi));
    localStorage.setItem('zhongkao_selected_provider', selectedProvider);
    setSaved(true);
    setTimeout(function() { setSaved(false); }, 2000);
    setLoading(false);
  }

  var providerList = Object.values(configs).filter(function(p) { return p.id !== 'custom'; });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">我的设置</h1>
      <p className="text-gray-500 mb-8">管理个人信息和AI配置</p>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>积分余额</CardTitle></CardHeader>
          <CardContent>
            {loggedIn && userId ? (
              <div>
                <CreditBalance userId={userId} />
                <p className="text-xs text-gray-400 mt-2">每次对话消耗10积分，新用户赠送5000积分</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">登录后赠送 <span className="font-bold text-blue-600">5000积分</span>，可免费对话约500次</p>
                <a href="/login" className="text-sm text-blue-600 hover:underline">登录 / 注册 →</a>
              </div>
            )}
          </CardContent>
        </Card>

        {loggedIn ? (
          <Card>
            <CardHeader><CardTitle>AI 模型配置</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">使用平台AI（消耗积分）</div>
                  <div className="text-xs text-gray-500">无需配置，开箱即用</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={useDefaultApi} onChange={function(e) { setUseDefaultApi(e.target.checked); }} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {!useDefaultApi ? (
                <div className="space-y-4 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">选择供应商</label>
                    <div className="flex flex-wrap gap-2">
                      {providerList.map(function(p) {
                        return (
                          <button key={p.id} onClick={function() { setSelectedProvider(p.id); setTestResult(null); }}
                            className={"px-3 py-1.5 rounded-lg text-sm transition-all border " + (selectedProvider === p.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300")}>
                            {p.name}
                          </button>
                        );
                      })}
                      <button onClick={function() { setSelectedProvider('custom'); setTestResult(null); }}
                        className={"px-3 py-1.5 rounded-lg text-sm transition-all border " + (selectedProvider === 'custom' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300")}>
                        + 自定义
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">供应商配置</div>

                    {selectedProvider === 'custom' ? (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">供应商名称</label>
                        <input value={current.name} onChange={function(e) { updateConfig('custom', 'name', e.target.value); }}
                          placeholder="例如：我的中转站"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Base URL</label>
                      <input value={current.baseUrl} onChange={function(e) { updateConfig(selectedProvider, 'baseUrl', e.target.value); }}
                        placeholder="https://api.example.com/v1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">API Key</label>
                      <input type="password" value={current.apiKey} onChange={function(e) { updateConfig(selectedProvider, 'apiKey', e.target.value); }}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">模型名称</label>
                        <input value={current.model} onChange={function(e) { updateConfig(selectedProvider, 'model', e.target.value); }}
                          placeholder="例如：deepseek-chat"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">接口协议</label>
                        <select value={current.protocol} onChange={function(e) { updateConfig(selectedProvider, 'protocol', e.target.value as 'chat' | 'responses'); }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="chat">Chat Completions</option>
                          <option value="responses">Responses API</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="primary" size="sm" onClick={handleTestConnection} disabled={testLoading || !current.apiKey || !current.baseUrl}>
                        {testLoading ? "测试中..." : "测试连接"}
                      </Button>
                    </div>

                    {testResult ? (
                      <div className={"p-2.5 rounded-lg text-xs " + (testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
                        {testResult.ok ? "✓ " : "✗ "}{testResult.msg}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="pt-2">
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                  {saved ? "已保存 ✓" : loading ? "保存中..." : "保存设置"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-3">登录后可配置自己的第三方API，对话不消耗积分</p>
              <a href="/login"><Button variant="primary">登录 / 注册</Button></a>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>积分说明</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>- 未登录用户可免费体验 <span className="font-bold text-blue-600">10次</span> 对话</p>
              <p>- 登录后赠送 <span className="font-bold text-blue-600">5000积分</span></p>
              <p>- 每次对话消耗 <span className="font-bold">10积分</span>，约500次</p>
              <p>- 配置自己的API Key后对话不消耗积分</p>
              <p>- 开通会员享无限次对话</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalCredits: 0, totalMessages: 0 });
  const [testModel, setTestModel] = useState('agnes-2.0-flash');
  const [testResult, setTestResult] = useState<{ok: boolean; msg: string} | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthed(true);
      loadAdminData(token);
    }
  }, []);

  async function handleLogin() {
    setAuthError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('admin_token', data.token);
        setAuthed(true);
        loadAdminData(data.token);
      } else {
        setAuthError(data.error || '密码错误');
      }
    } catch(e: any) {
      setAuthError('登录失败');
    }
  }

  async function loadAdminData(token: string) {
    try {
      const res = await fetch('/api/admin?token=' + token);
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users || []);
        setStats(data.stats || { totalUsers: 0, totalCredits: 0, totalMessages: 0 });
      }
    } catch(e) {}
  }

  async function handleTestConnection() {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', password: localStorage.getItem('admin_token'), model: testModel }),
      });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? data.message : data.error });
    } catch(e: any) {
      setTestResult({ ok: false, msg: '请求失败：' + e.message });
    }
    setTestLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    setAuthed(false);
    setPassword('');
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-32">
        <Card>
          <CardHeader><CardTitle>管理员登录</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">请输入管理员密码</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              placeholder="管理员密码"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {authError ? <p className="text-sm text-red-500">{authError}</p> : null}
            <Button variant="primary" className="w-full" onClick={handleLogin}>登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-500 text-sm">中考提分AI私教 - 平台管理</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500">退出管理</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-500 mt-1">注册用户</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalCredits}</div>
            <div className="text-sm text-gray-500 mt-1">总发放积分</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalMessages}</div>
            <div className="text-sm text-gray-500 mt-1">累计对话</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>连接测试</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">测试默认AI供应商是否正常响应。</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
              <input type="text" value={testModel} onChange={(e) => setTestModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <Button variant="primary" onClick={handleTestConnection} disabled={testLoading}>
              {testLoading ? '测试中...' : '测试连接'}
            </Button>
          </div>
          {testResult ? (
            <div className={"p-3 rounded-lg text-sm " + (testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
              {testResult.ok ? '\u2713 ' : '\u2717 '}{testResult.msg}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>用户管理</CardTitle></CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">暂无用户数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">邮箱</th>
                    <th className="text-left py-2 font-medium text-gray-600">积分余额</th>
                    <th className="text-left py-2 font-medium text-gray-600">注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2">{u.email || '-'}</td>
                      <td className="py-2">{u.credits ?? '-'}</td>
                      <td className="py-2 text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

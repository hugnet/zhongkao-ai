'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditBalance } from '@/components/credits/CreditBalance';

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  var uid = localStorage.getItem('zhongkao_user_id') || '';
  return uid.length > 0 && uid.indexOf('anon_') !== 0;
}

export default function SettingsPage() {
  var [userId, setUserId] = useState('');
  var [loggedIn, setLoggedIn] = useState(false);
  var [userName, setUserName] = useState('');

  useEffect(function() {
    setLoggedIn(isLoggedIn());
    var stored = localStorage.getItem('zhongkao_user_id');
    if (stored) setUserId(stored);
    var email = localStorage.getItem('zhongkao_user_email') || '';
    setUserName(email.split('@')[0] || '用户');
  }, []);

  function handleLogout() {
    localStorage.removeItem('zhongkao_user_id');
    localStorage.removeItem('zhongkao_user_email');
    window.location.href = '/';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">我的设置</h1>
      <p className="text-gray-500 mb-8">管理个人信息和积分</p>

      <Card className="mb-6">
        <CardHeader><CardTitle>账户信息</CardTitle></CardHeader>
        <CardContent>
          {loggedIn ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">用户名</span>
                <span className="text-sm text-gray-900 font-medium">{userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">用户ID</span>
                <span className="text-sm text-gray-900 font-mono">{userId.slice(0, 16)}...</span>
              </div>
              <div className="pt-2">
                <CreditBalance userId={userId || null} />
              </div>
              <div className="text-xs text-gray-400">按实际对话token消耗积分，用多少扣多少</div>
              <div className="pt-2">
                <Button variant="outline" onClick={handleLogout}>退出登录</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">请先登录后查看账户信息</p>
              <a href="/login"><Button variant="primary">登录 / 注册</Button></a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>积分说明</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>- 注册即赠 <span className="font-bold text-blue-600">100积分</span></p>
            <p>- 积分按实际对话token消耗扣除，每次约1-10积分</p>
            <p>- 积分用完后可购买积分包或开通会员</p>
            <p>- 月度会员 ¥39/月，不限对话次数</p>
            <p>- 年度会员 ¥299/年，不限对话+赠送5000积分</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
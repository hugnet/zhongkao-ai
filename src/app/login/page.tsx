'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { signInWithEmail, signUp, getSupabase } from '@/lib/supabase/client';

export default function LoginPage() {
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [isSignUp, setIsSignUp] = useState(false);
  var [message, setMessage] = useState('');
  var [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (isSignUp) {
        var result = await signUp(email, password);
        if (result.error) {
          setMessage(result.error.message);
        } else {
          setMessage('注册成功！请查看邮箱并点击确认链接。确认后才能登录使用。');
        }
      } else {
        var result = await signInWithEmail(email, password);
        if (result.error) {
          if (result.error.message && result.error.message.includes('Email not confirmed')) {
            setMessage('请先到邮箱点击确认链接后再登录。');
          } else {
            setMessage(result.error.message);
          }
        } else {
          var sb = getSupabase();
          if (sb) {
            var { data: sessionData } = await sb.auth.getSession();
            var user = sessionData?.session?.user;
            if (user) {
              if (!user.email_confirmed_at) {
                await sb.auth.signOut();
                setMessage('请先到邮箱确认后再登录。');
              } else {
                localStorage.setItem('zhongkao_user_id', user.id);
                localStorage.setItem('zhongkao_user_email', user.email || '');
                setMessage('登录成功！正在跳转...');
                setTimeout(function() { window.location.href = '/chat'; }, 500);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessage('操作失败：' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card>
        <CardHeader><CardTitle>{isSignUp ? '注册' : '登录'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            {message ? <p className="text-sm text-blue-600">{message}</p> : null}
            <Button variant="primary" className="w-full" type="submit" disabled={loading}>{loading ? '处理中...' : (isSignUp ? '注册' : '登录')}</Button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={function() { setIsSignUp(!isSignUp); setMessage(''); }} className="text-sm text-blue-600 hover:underline">{isSignUp ? '已有账号？登录' : '没有账号？注册'}</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
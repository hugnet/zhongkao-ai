'use client';

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { signInWithEmail, signUp } from '@/lib/supabase/client';

export default function LoginPage() {
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [isSignUp, setIsSignUp] = useState(false);
  var [message, setMessage] = useState('');

  async function handleSubmit(e: any) {
    e.preventDefault();
    setMessage('');
    try {
      var result = isSignUp ? await signUp(email, password) : await signInWithEmail(email, password);
      if (result.error) {
        setMessage(result.error.message);
      } else {
        setMessage(isSignUp ? "注册成功！请检查邮箱确认。" : "登录成功！");
      }
    } catch (err: any) {
      setMessage('操作失败：' + err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card>
        <CardHeader>
          <CardTitle>{isSignUp ? "注册" : "登录"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {message ? <p className="text-sm text-blue-600">{message}</p> : null}
            <Button variant="primary" className="w-full" type="submit">{isSignUp ? "注册" : "登录"}</Button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={function() { setIsSignUp(!isSignUp); }} className="text-sm text-blue-600 hover:underline">
              {isSignUp ? "已有账号？登录" : "没有账号？注册"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
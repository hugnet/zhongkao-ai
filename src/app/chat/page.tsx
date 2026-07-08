'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SUBJECTS, AGENTS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
}

var FREE_LIMIT = 10;
var CREDITS_PER_MSG = 10;

function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  var saved = localStorage.getItem('zhongkao_fp');
  if (saved) return saved;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  if (ctx) { ctx.textBaseline = 'top'; ctx.font = '14px Arial'; ctx.fillText('fingerprint', 2, 2); }
  var raw = navigator.userAgent + '|' + screen.width + 'x' + screen.height + '|' + (canvas.toDataURL() || '') + '|' + navigator.language;
  var hash = 0;
  for (var i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  var fp = 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  localStorage.setItem('zhongkao_fp', fp);
  return fp;
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  var uid = localStorage.getItem('zhongkao_user_id') || '';
  return uid.indexOf('anon_') !== 0;
}

export default function ChatPage() {
  var [messages, setMessages] = useState<ChatMsg[]>([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var [currentAgent, setCurrentAgent] = useState('math-tutor');
  var [userId, setUserId] = useState<string | null>(null);
  var [showRecharge, setShowRecharge] = useState(false);
  var [lowBalance, setLowBalance] = useState(0);
  var [freeRemaining, setFreeRemaining] = useState(FREE_LIMIT);
  var [showLoginPrompt, setShowLoginPrompt] = useState(false);
  var [fingerprint, setFingerprint] = useState('');
  var [loggedIn, setLoggedIn] = useState(false);
  var messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(function() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(function() {
    var stored = localStorage.getItem('zhongkao_user_id');
    var hasAcc = isLoggedIn();
    if (!stored) {
      stored = 'anon_' + generateId();
      localStorage.setItem('zhongkao_user_id', stored);
    }
    setUserId(stored);
    setLoggedIn(hasAcc);

    var fp = getFingerprint();
    setFingerprint(fp);

    if (!hasAcc) {
      fetch('/api/anonymous-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp, action: 'check' }),
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.ok) setFreeRemaining(data.remaining);
      }).catch(function() {});
    }
  }, []);

  var agent = AGENTS.find(function(a) { return a.id === currentAgent; });
  var subject = SUBJECTS.find(function(s) { return s.agentId === currentAgent; });

  async function handleSend() {
    if (!input.trim() || loading) return;

    if (!loggedIn && freeRemaining <= 0) {
      setShowLoginPrompt(true);
      return;
    }

    var userMsg: ChatMsg = { id: generateId(), role: 'user', content: input, agentId: currentAgent };
    setMessages(function(prev) { return [...prev, userMsg]; });
    setInput('');
    setLoading(true);

    try {
      var localKey = localStorage.getItem('zhongkao_custom_api_key') || '';
      var localProvider = localStorage.getItem('zhongkao_custom_provider') || 'deepseek';

      if (localKey) {
        var res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.concat(userMsg).map(function(m) { return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }; }).slice(-20),
            agentId: currentAgent,
            apiKey: localKey,
            providerId: localProvider,
          }),
        });
        var data = await res.json();
        if (data.error) {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '出错了，请稍后重试。', agentId: currentAgent }]; });
        } else {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: data.content, agentId: currentAgent }]; });
        }
      } else {
        var defaultRes = await fetch('/api/chat/default', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.concat(userMsg).map(function(m) { return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }; }).slice(-20),
            agentId: currentAgent,
            userId: loggedIn ? userId : null,
            fingerprint: loggedIn ? null : fingerprint,
          }),
        });
        var defaultData = await defaultRes.json();

        if (defaultData.error === 'ANON_LIMIT_EXCEEDED') {
          setFreeRemaining(0);
          setShowLoginPrompt(true);
          setMessages(function(prev) { return prev.slice(0, -1); });
        } else if (defaultData.error === 'INSUFFICIENT_CREDITS') {
          setLowBalance(defaultData.credits || 0);
          setShowRecharge(true);
        } else if (defaultData.error) {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '服务暂时不可用，请稍后重试。', agentId: currentAgent }]; });
        } else {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: defaultData.content, agentId: currentAgent }]; });
          if (!loggedIn) {
            setFreeRemaining(function(prev) { return Math.max(0, prev - 1); });
          }
        }
      }
    } catch (err: any) {
      setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '服务暂时不可用，请稍后再试。', agentId: currentAgent }]; });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 h-[calc(100vh-5rem)]">
      <CreditRechargeModal open={showRecharge} balance={0} onClose={function() { setShowRecharge(false); }} />

      {showLoginPrompt ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={function() { setShowLoginPrompt(false); }}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center">
              <div className="text-4xl mb-3">&#127919;</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">免费体验已用完</h3>
              <p className="text-sm text-gray-500 mb-1">每台设备仅限10次免费对话</p>
              <p className="text-sm text-gray-500 mb-4">注册登录后赠送5000积分，可对话约500次</p>
              <div className="space-y-2">
                <a href="/login" className="block w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">登录 / 注册</a>
                <button onClick={function() { setShowLoginPrompt(false); }} className="block w-full text-gray-400 text-sm py-2">稍后再说</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="w-52 shrink-0 space-y-2 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">选择学科</h3>
        {SUBJECTS.map(function(sub) {
          return (
            <button key={sub.id} onClick={function() { setCurrentAgent(sub.agentId); }}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left " + (currentAgent === sub.agentId ? "bg-blue-50 text-blue-700 font-medium shadow-sm" : "text-gray-600 hover:bg-gray-100")}>
              <span className="text-xl">{sub.icon}</span>
              <span>{sub.label}</span>
            </button>
          );
        })}

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          {loggedIn ? (
            <CreditBalance userId={userId} onLowCredits={function(b) { setLowBalance(b); setShowRecharge(true); }} />
          ) : (
            <div className={"text-xs rounded-lg p-2 " + (freeRemaining <= 3 ? "text-red-600 bg-red-50 border border-red-200" : "text-gray-500 bg-yellow-50 border border-yellow-200")}>
              <span className="font-bold">{freeRemaining}</span> 次免费对话剩余
              <a href="/login" className="block text-blue-600 mt-1 hover:underline">登录获取5000积分 →</a>
            </div>
          )}
          <a href="/settings" className="block text-xs text-gray-400 hover:text-blue-600 transition-colors">&#9881; 设置</a>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <span className="text-3xl">{subject?.icon}</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">{agent?.name} · {agent?.title}</h2>
            <p className="text-sm text-gray-500">{agent?.description.slice(0, 60)}..</p>
          </div>
          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full">{loggedIn ? '已登录' : freeRemaining + '次免费'}</span>
        </div>

        <div className="flex-1 overflow-y-auto chat-messages space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">{subject?.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">向 {agent?.name} 提问</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">{loggedIn ? '使用积分开始对话' : '每台设备限10次免费，登录赠送5000积分'}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {(agent?.skills || []).slice(0, 6).map(function(s) {
                  return (
                    <button key={s.id} onClick={function() { setInput("老师，我有个" + s.name + "的问题：" + s.triggers[0]); }}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map(function(msg) {
              var isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={"flex gap-3 animate-fade-in " + (isUser ? "justify-end" : "")}>
                  {!isUser ? <span className="text-2xl shrink-0 mt-1">{subject?.icon}</span> : null}
                  <div className={"max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed " + (isUser ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800")}>
                    {msg.content.split("\n").map(function(line, i) {
                      return <p key={i} className={line.trim() ? "mb-1" : "h-2"}>{line || "\u00A0"}</p>;
                    })}
                  </div>
                </div>
              );
            })
          )}
          {loading ? (
            <div className="flex gap-3 animate-fade-in">
              <span className="text-2xl shrink-0 mt-1">{subject?.icon}</span>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input value={input} onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={loggedIn || freeRemaining > 0 ? "向" + (agent?.name || "老师") + "提问..." : "登录后继续提问"}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loading || (!loggedIn && freeRemaining <= 0)} />
            <Button variant="primary" onClick={handleSend} disabled={loading || !input.trim() || (!loggedIn && freeRemaining <= 0)}>
              {loading ? "思考中..." : "发送"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

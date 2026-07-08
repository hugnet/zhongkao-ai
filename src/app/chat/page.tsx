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

function getFreeCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('zhongkao_free_count') || '0');
}
function setFreeCount(n: number) {
  localStorage.setItem('zhongkao_free_count', String(n));
}
function getLocalCredits(): number {
  if (typeof window === 'undefined') return 5000;
  return parseInt(localStorage.getItem('zhongkao_credits') || '5000');
}
function setLocalCredits(n: number) {
  localStorage.setItem('zhongkao_credits', String(n));
}
function hasAccount(): boolean {
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
  var [freeCount, setFreeCountState] = useState(0);
  var [credits, setCreditsState] = useState(5000);
  var [showLoginPrompt, setShowLoginPrompt] = useState(false);
  var messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(function() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(function() {
    var stored = localStorage.getItem('zhongkao_user_id');
    var hasAcc = hasAccount();
    if (!stored) {
      stored = 'anon_' + generateId();
      localStorage.setItem('zhongkao_user_id', stored);
    }
    setUserId(stored);
    setFreeCountState(getFreeCount());
    setCreditsState(getLocalCredits());
  }, []);

  var agent = AGENTS.find(function(a) { return a.id === currentAgent; });
  var subject = SUBJECTS.find(function(s) { return s.agentId === currentAgent; });

  async function handleSend() {
    if (!input.trim() || loading) return;

    var hasAcc = hasAccount();
    var fc = getFreeCount();
    var cr = getLocalCredits();

    if (!hasAcc && fc >= FREE_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }
    if (hasAcc && cr < CREDITS_PER_MSG) {
      setLowBalance(cr);
      setShowRecharge(true);
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
            userId: hasAcc ? userId : null,
          }),
        });
        var defaultData = await defaultRes.json();
        if (defaultData.error === 'INSUFFICIENT_CREDITS') {
          setLowBalance(defaultData.credits || 0);
          setShowRecharge(true);
        } else if (defaultData.error) {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '服务暂时不可用，请稍后重试。', agentId: currentAgent }]; });
        } else {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: defaultData.content, agentId: currentAgent }]; });
          if (!hasAcc) {
            fc = fc + 1;
            setFreeCount(fc);
            setFreeCountState(fc);
            localStorage.setItem('zhongkao_free_count', String(fc));
          } else {
            cr = Math.max(0, cr - CREDITS_PER_MSG);
            setLocalCredits(cr);
            setCreditsState(cr);
            if (cr < 100) {
              setLowBalance(cr);
              setShowRecharge(true);
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '服务暂时不可用，请稍后再试。', agentId: currentAgent }]; });
    }
    setLoading(false);
  }

  var remaining = hasAccount() ? Math.floor(credits / CREDITS_PER_MSG) : Math.max(0, FREE_LIMIT - freeCount);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 h-[calc(100vh-5rem)]">
      <CreditRechargeModal open={showRecharge} balance={hasAccount() ? credits : 0} onClose={function() { setShowRecharge(false); }} />

      {showLoginPrompt ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={function() { setShowLoginPrompt(false); }}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center">
              <div className="text-4xl mb-3">&#127919;</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">免费体验已用完</h3>
              <p className="text-sm text-gray-500 mb-4">登录后赠送5000积分，可继续对话约500次</p>
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
          {hasAccount() ? (
            <CreditBalance userId={userId} onLowCredits={function(b) { setLowBalance(b); setShowRecharge(true); }} />
          ) : (
            <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <span className="font-bold text-yellow-700">{remaining}</span> 次免费对话剩余
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
          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full">{hasAccount() ? credits + '积分' : remaining + '次免费'}</span>
        </div>

        <div className="flex-1 overflow-y-auto chat-messages space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">{subject?.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">向 {agent?.name} 提问</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">{hasAccount() ? '使用积分开始对话' : '免费体验' + FREE_LIMIT + '次，登录赠送5000积分'}</p>
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
              placeholder={hasAccount() || freeCount < FREE_LIMIT ? "向" + (agent?.name || "老师") + "提问..." : "登录后继续提问"}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loading || (!hasAccount() && freeCount >= FREE_LIMIT)} />
            <Button variant="primary" onClick={handleSend} disabled={loading || !input.trim() || (!hasAccount() && freeCount >= FREE_LIMIT)}>
              {loading ? "思考中..." : "发送"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

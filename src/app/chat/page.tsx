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

export default function ChatPage() {
  var [messages, setMessages] = useState<ChatMsg[]>([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var [currentAgent, setCurrentAgent] = useState('math-tutor');
  var [userId, setUserId] = useState<string | null>(null);
  var [showRecharge, setShowRecharge] = useState(false);
  var [lowBalance, setLowBalance] = useState(0);
  var [creditWarning, setCreditWarning] = useState('');
  var messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(function() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(function() {
    var stored = localStorage.getItem('zhongkao_user_id');
    if (!stored) {
      stored = 'anon_' + generateId();
      localStorage.setItem('zhongkao_user_id', stored);
    }
    setUserId(stored);
  }, []);

  var agent = AGENTS.find(function(a) { return a.id === currentAgent; });
  var subject = SUBJECTS.find(function(s) { return s.agentId === currentAgent; });

  async function handleSend() {
    if (!input.trim() || loading) return;
    var userMsg: ChatMsg = { id: generateId(), role: 'user', content: input, agentId: currentAgent };
    setMessages(function(prev) { return [...prev, userMsg]; });
    setInput('');
    setLoading(true);
    setCreditWarning('');

    try {
      var localKey = localStorage.getItem('zhongkao_custom_api_key') || '';
      var localProvider = localStorage.getItem('zhongkao_custom_provider') || 'deepseek';

      if (localKey) {
        var res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.concat(userMsg).map(function(m) { return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }; }),
            agentId: currentAgent,
            apiKey: localKey,
            providerId: localProvider,
          }),
        });
        var data = await res.json();
        if (data.error) {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '出错了：' + data.error, agentId: currentAgent }]; });
        } else {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: data.content, agentId: currentAgent }]; });
        }
      } else {
        var defaultRes = await fetch('/api/chat/default', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.concat(userMsg).map(function(m) { return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }; }),
            agentId: currentAgent,
            userId: userId,
          }),
        });
        var defaultData = await defaultRes.json();
        if (defaultData.error === 'INSUFFICIENT_CREDITS') {
          setLowBalance(defaultData.credits || 0);
          setShowRecharge(true);
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '积分不足，请充值后继续使用。', agentId: currentAgent }]; });
        } else if (defaultData.error) {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '出错了：' + defaultData.error, agentId: currentAgent }]; });
        } else {
          setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: defaultData.content, agentId: currentAgent }]; });
          if (defaultData.credits >= 0 && defaultData.credits < 100) {
            setLowBalance(defaultData.credits);
            setShowRecharge(true);
          }
        }
      }
    } catch (err: any) {
      setMessages(function(prev) { return [...prev, { id: generateId(), role: 'assistant', content: '服务暂时不可用：' + (err.message || '请稍后再试'), agentId: currentAgent }]; });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 h-[calc(100vh-5rem)]">
      <CreditRechargeModal open={showRecharge} balance={lowBalance} onClose={function() { setShowRecharge(false); }} />

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

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          <CreditBalance userId={userId} onLowCredits={function(b) { setLowBalance(b); setShowRecharge(true); }} />
          <a href="/settings" className="block text-xs text-gray-400 hover:text-blue-600 transition-colors">
            &#9881; API与积分设置
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <span className="text-3xl">{subject?.icon}</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">{agent?.name} · {agent?.title}</h2>
            <p className="text-sm text-gray-500">{agent?.description.slice(0, 60)}..</p>
          </div>
          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-200">免费使用</span>
        </div>

        <div className="flex-1 overflow-y-auto chat-messages space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">{subject?.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">向 {agent?.name} 提问</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">新用户赠送5000积分，可免费对话约500次</p>
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
              placeholder={"向" + (agent?.name || "老师") + "提问..."}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loading} />
            <Button variant="primary" onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? "思考中..." : "发送"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

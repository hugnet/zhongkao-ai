'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SUBJECTS, AGENTS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal';

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; agentId?: string; }
interface HistoryItem { id: string; agent_id: string; title: string; updated_at: string; }

var FREE_LIMIT = 10;
var CREDITS_PER_MSG = 10;

function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  var saved = localStorage.getItem('zhongkao_fp');
  if (saved) return saved;
  var parts = [navigator.userAgent, screen.width + 'x' + screen.height, navigator.language, navigator.platform];
  var raw = parts.join('|');
  var hash = 0;
  for (var i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  var fp = 'fp_' + Math.abs(hash).toString(36);
  localStorage.setItem('zhongkao_fp', fp);
  return fp;
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return (localStorage.getItem('zhongkao_user_id') || '').indexOf('anon_') !== 0;
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
  var [histories, setHistories] = useState<HistoryItem[]>([]);
  var [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  var [showHistory, setShowHistory] = useState(false);
  var messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(function() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(function() {
    var stored = localStorage.getItem('zhongkao_user_id');
    var hasAcc = isLoggedIn();
    if (!stored) { stored = 'anon_' + generateId(); localStorage.setItem('zhongkao_user_id', stored); }
    setUserId(stored);
    setLoggedIn(hasAcc);
    var fp = getFingerprint();
    setFingerprint(fp);
    if (!hasAcc) {
      fetch('/api/anonymous-usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fingerprint: fp, action: 'check' }) })
        .then(function(r) { return r.json(); }).then(function(d) { if (d.ok) setFreeRemaining(d.remaining); }).catch(function() {});
    }
    if (hasAcc && stored) loadHistories(stored);
  }, []);

  function loadHistories(uid: string) {
    fetch('/api/chat-history?userId=' + uid).then(function(r) { return r.json(); }).then(function(d) {
      if (d.ok) setHistories(d.histories || []);
    }).catch(function() {});
  }

  function startNewChat() {
    setMessages([]);
    setCurrentHistoryId(null);
    setShowHistory(false);
  }

  function loadChat(h: HistoryItem) {
    var sb = require('@supabase/supabase-js');
    setShowHistory(false);
    fetch('/api/chat-history?userId=' + userId).then(function(r) { return r.json(); }).then(function(d) {
      if (d.ok && d.histories) {
        var found = d.histories.find(function(x: any) { return x.id === h.id; });
        if (found && found.messages) { setMessages(found.messages); setCurrentHistoryId(h.id); setCurrentAgent(h.agent_id); }
      }
    }).catch(function() {});
  }

  async function saveChat(msgs: ChatMsg[], agentId: string) {
    if (!loggedIn || !userId) return;
    var title = (msgs[0]?.content || '新对话').slice(0, 30);
    try {
      var res = await fetch('/api/chat-history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, historyId: currentHistoryId, agentId: agentId, title: title, messages: msgs }),
      });
      var d = await res.json();
      if (d.ok && d.id && !currentHistoryId) setCurrentHistoryId(d.id);
      loadHistories(userId);
    } catch(e) {}
  }

  var agent = AGENTS.find(function(a) { return a.id === currentAgent; });
  var subject = SUBJECTS.find(function(s) { return s.agentId === currentAgent; });

  async function handleSend() {
    if (!input.trim() || loading) return;
    if (!loggedIn && freeRemaining <= 0) { setShowLoginPrompt(true); return; }
    var userMsg: ChatMsg = { id: generateId(), role: 'user', content: input, agentId: currentAgent };
    var newMsgs = messages.concat(userMsg);
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      var localKey = localStorage.getItem('zhongkao_custom_api_key') || '';
      var localProvider = localStorage.getItem('zhongkao_custom_provider') || 'deepseek';

      if (localKey) {
        var res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMsgs.map(function(m) { return { role: m.role, content: m.content }; }).slice(-20), agentId: currentAgent, apiKey: localKey, providerId: localProvider }) });
        var data = await res.json();
        var reply = data.error ? '出错了，请稍后重试。' : data.content;
        var allMsgs = newMsgs.concat([{ id: generateId(), role: 'assistant', content: reply, agentId: currentAgent }]);
        setMessages(allMsgs);
        if (loggedIn) saveChat(allMsgs, currentAgent);
      } else {
        var defaultRes = await fetch('/api/chat/default', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMsgs.map(function(m) { return { role: m.role, content: m.content }; }).slice(-20), agentId: currentAgent, userId: loggedIn ? userId : null, fingerprint: loggedIn ? null : fingerprint }) });
        var defaultData = await defaultRes.json();
        if (defaultData.error === 'ANON_LIMIT_EXCEEDED') { setFreeRemaining(0); setShowLoginPrompt(true); setMessages(messages); }
        else if (defaultData.error === 'INSUFFICIENT_CREDITS') { setLowBalance(defaultData.credits || 0); setShowRecharge(true); }
        else if (defaultData.error) { setMessages(newMsgs.concat([{ id: generateId(), role: 'assistant', content: '服务暂时不可用。', agentId: currentAgent }])); }
        else {
          var assistantMsg = { id: generateId(), role: 'assistant' as const, content: defaultData.content, agentId: currentAgent };
          var allMsgs2 = newMsgs.concat([assistantMsg]);
          setMessages(allMsgs2);
          if (!loggedIn) setFreeRemaining(function(p) { return Math.max(0, p - 1); });
          if (loggedIn) saveChat(allMsgs2, currentAgent);
        }
      }
    } catch (err: any) {
      setMessages(newMsgs.concat([{ id: generateId(), role: 'assistant', content: '服务暂时不可用。', agentId: currentAgent }]));
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
              <p className="text-sm text-gray-500 mb-4">注册登录后赠送5000积分</p>
              <a href="/login" className="block w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">登录 / 注册</a>
              <button onClick={function() { setShowLoginPrompt(false); }} className="block w-full text-gray-400 text-sm py-2 mt-1">稍后再说</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="w-52 shrink-0 space-y-2 overflow-y-auto">
        {loggedIn ? (
          <button onClick={startNewChat} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">+ 新对话</button>
        ) : null}
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">选择学科</h3>
        {SUBJECTS.map(function(sub) {
          return (
            <button key={sub.id} onClick={function() { setCurrentAgent(sub.agentId); }}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left " + (currentAgent === sub.agentId ? "bg-blue-50 text-blue-700 font-medium shadow-sm" : "text-gray-600 hover:bg-gray-100")}>
              <span className="text-xl">{sub.icon}</span><span>{sub.label}</span>
            </button>
          );
        })}

        {loggedIn && histories.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">历史对话</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {histories.slice(0, 20).map(function(h) {
                return (
                  <button key={h.id} onClick={function() { loadChat(h); }}
                    className={"w-full text-left px-2 py-1.5 rounded text-xs truncate transition-colors " + (currentHistoryId === h.id ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50")}>
                    {h.title}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {loggedIn ? (
            <CreditBalance userId={userId} onLowCredits={function(b) { setLowBalance(b); setShowRecharge(true); }} />
          ) : (
            <div className={"text-xs rounded-lg p-2 " + (freeRemaining <= 3 ? "text-red-600 bg-red-50 border border-red-200" : "text-gray-500 bg-yellow-50 border border-yellow-200")}>
              <span className="font-bold">{freeRemaining}</span> 次免费剩余
              <a href="/login" className="block text-blue-600 mt-1 hover:underline">登录获取5000积分 →</a>
            </div>
          )}
          <a href="/settings" className="block text-xs text-gray-400 hover:text-blue-600">&#9881; 设置</a>
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
              <p className="text-sm text-gray-500 max-w-md mx-auto">{loggedIn ? '使用积分开始对话' : '每台设备限10次免费'}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {(agent?.skills || []).slice(0, 6).map(function(s) {
                  return <button key={s.id} onClick={function() { setInput("老师，我有个" + s.name + "的问题：" + s.triggers[0]); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200">{s.name}</button>;
                })}
              </div>
            </div>
          ) : messages.map(function(msg) {
            var isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={"flex gap-3 animate-fade-in " + (isUser ? "justify-end" : "")}>
                {!isUser ? <span className="text-2xl shrink-0 mt-1">{subject?.icon}</span> : null}
                <div className={"max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed " + (isUser ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800")}>
                  {msg.content.split("\n").map(function(line, i) { return <p key={i} className={line.trim() ? "mb-1" : "h-2"}>{line || "\u00A0"}</p>; })}
                </div>
              </div>
            );
          })}
          {loading ? (
            <div className="flex gap-3 animate-fade-in">
              <span className="text-2xl shrink-0 mt-1">{subject?.icon}</span>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3"><div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div></div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input value={input} onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={loggedIn || freeRemaining > 0 ? "向" + (agent?.name || "老师") + "提问..." : "登录后继续提问"}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SUBJECTS, AGENTS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal';

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; agentId?: string; tokenInfo?: any; }
interface HistoryItem { id: string; agent_id: string; title: string; messages?: ChatMsg[]; updated_at?: string; serverId?: string; }

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  var uid = localStorage.getItem('zhongkao_user_id') || '';
  return uid.length > 0 && uid.indexOf('anon_') !== 0;
}

export default function ChatPage() {
  var [messages, setMessages] = useState<ChatMsg[]>([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var [currentAgent, setCurrentAgent] = useState('math-tutor');
  var [userId, setUserId] = useState<string | null>(null);
  var [showRecharge, setShowRecharge] = useState(false);
  var [lowBalance, setLowBalance] = useState(0);
  var [loggedIn, setLoggedIn] = useState(false);
  var [histories, setHistories] = useState<HistoryItem[]>([]);
  var [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  var [lastUsage, setLastUsage] = useState<any>(null);
  var messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(function() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(function() {
    var hasAcc = isLoggedIn();
    setLoggedIn(hasAcc);
    if (hasAcc) {
      var uid = localStorage.getItem('zhongkao_user_id');
      setUserId(uid);
      loadServerHistories(uid!);
    }
  }, []);

  async function loadServerHistories(uid: string) {
    try {
      var res = await fetch('/api/chat-history?userId=' + uid);
      var data = await res.json();
      if (data.ok && data.histories) {
        var items: HistoryItem[] = data.histories.map(function(h: any) {
          return { id: 'server_' + h.id, serverId: h.id, agent_id: h.agent_id, title: h.title, updated_at: h.updated_at, messages: undefined };
        });
        setHistories(items);
      }
    } catch(e) {}
  }

  async function loadHistoryMessages(h: HistoryItem) {
    if (h.messages) {
      setMessages(h.messages);
      setCurrentHistoryId(h.id);
      return;
    }
    if (h.serverId && userId) {
      try {
        var res = await fetch('/api/chat-history?userId=' + userId + '&historyId=' + h.serverId);
        var data = await res.json();
        if (data.ok && data.history) {
          var msgs: ChatMsg[] = (data.history.messages || []).map(function(m: any, i: number) {
            return { id: 'msg_' + i, role: m.role, content: m.content, agentId: h.agent_id };
          });
          setMessages(msgs);
          setCurrentHistoryId(h.id);
          setHistories(function(prev) {
            return prev.map(function(item) { return item.id === h.id ? { ...item, messages: msgs } : item; });
          });
        }
      } catch(e) {}
    }
  }

  async function saveHistory(msgs: ChatMsg[], agentId: string) {
    var title = (msgs.find(function(m) { return m.role === 'user'; })?.content || '新对话').slice(0, 30);

    if (userId) {
      try {
        var payload: any = { userId: userId, agentId: agentId, title: title, messages: msgs.map(function(m) { return { role: m.role, content: m.content }; }) };
        if (currentHistoryId && currentHistoryId.startsWith('server_')) {
          payload.historyId = currentHistoryId.replace('server_', '');
        }
        var res = await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var data = await res.json();
        if (data.ok && data.id && !currentHistoryId) {
          var newId = 'server_' + data.id;
          setCurrentHistoryId(newId);
          setHistories(function(prev) {
            var newItem: HistoryItem = { id: newId, serverId: data.id, agent_id: agentId, title: title, messages: msgs, updated_at: new Date().toISOString() };
            return [newItem].concat(prev.filter(function(h) { return h.id !== newId; }));
          });
          return;
        }
        if (data.ok) {
          setHistories(function(prev) {
            return prev.map(function(h) { return h.id === currentHistoryId ? { ...h, title: title, messages: msgs, updated_at: new Date().toISOString() } : h; });
          });
        }
      } catch(e) {}
    }
  }

  function startNewChat() {
    setMessages([]);
    setCurrentHistoryId(null);
    setLastUsage(null);
  }

  var agent = AGENTS.find(function(a) { return a.id === currentAgent; });
  var subject = SUBJECTS.find(function(s) { return s.agentId === currentAgent; });

  async function handleSend() {
    if (!input.trim() || loading) return;

    if (!loggedIn) {
      window.location.href = '/login';
      return;
    }

    var userMsg: ChatMsg = { id: generateId(), role: 'user', content: input, agentId: currentAgent };
    var newMsgs = messages.concat(userMsg);
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setLastUsage(null);

    try {
      var res = await fetch('/api/chat/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(function(m) { return { role: m.role, content: m.content }; }).slice(-20),
          agentId: currentAgent,
          userId: userId,
        }),
      });
      var data = await res.json();

      if (data.error === 'INSUFFICIENT_CREDITS') {
        setLowBalance(data.credits || 0);
        setShowRecharge(true);
        setLoading(false);
        setMessages(messages);
        return;
      }

      var reply = data.error ? ('请求出错：' + (data.error || '请稍后重试')) : (data.content || '抱歉，暂时无法回答。');
      var assistantMsg: ChatMsg = { id: generateId(), role: 'assistant', content: reply, agentId: currentAgent, tokenInfo: data.usage };
      var allMsgs = newMsgs.concat([assistantMsg]);
      setMessages(allMsgs);
      setLastUsage(data.usage || null);
      await saveHistory(allMsgs, currentAgent);
    } catch(e: any) {
      var errorMsg = '网络错误，请检查网络连接后重试。';
      if (e.message) errorMsg = '请求失败：' + e.message;
      var allMsgs = newMsgs.concat([{ id: generateId(), role: 'assistant', content: errorMsg, agentId: currentAgent }]);
      setMessages(allMsgs);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-64 border-r border-gray-200 bg-white p-4 flex flex-col shrink-0">
        <Button variant="primary" className="w-full mb-4" onClick={startNewChat}>+ 新对话</Button>

        <div className="space-y-1 mb-2">
          {SUBJECTS.map(function(sub) {
            return (
              <button key={sub.id} onClick={function() { setCurrentAgent(sub.agentId); startNewChat(); }}
                className={"w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 " + (currentAgent === sub.agentId ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50")}>
                <span>{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>

        {histories.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-200 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">历史对话</h3>
            <div className="space-y-1 overflow-y-auto flex-1">
              {histories.slice(0, 30).map(function(h) {
                return (
                  <button key={h.id} onClick={function() { loadHistoryMessages(h); }}
                    className={"w-full text-left px-2 py-1.5 rounded text-xs truncate transition-colors " + (currentHistoryId === h.id ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50")}>
                    {h.title}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <CreditBalance userId={userId} onLowCredits={function(b) { setLowBalance(b); setShowRecharge(true); }} />
          <a href="/settings" className="block text-xs text-gray-400 hover:text-blue-600">&#9881; 设置</a>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 px-6">
          <span className="text-3xl">{subject?.icon}</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">{agent?.name} · {agent?.title}</h2>
            <p className="text-sm text-gray-500">{agent?.description.slice(0, 60)}..</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto chat-messages space-y-4 pr-6 pl-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">{subject?.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">向 {agent?.name} 提问</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">按实际对话token消耗积分，用多少扣多少</p>
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
                  {!isUser && msg.tokenInfo && msg.tokenInfo.credits_used ? (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                      消耗 {msg.tokenInfo.credits_used} 积分 (输入{msg.tokenInfo.prompt_tokens} + 输出{msg.tokenInfo.completion_tokens} tokens)
                    </div>
                  ) : null}
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

        <div className="mt-4 pt-4 border-t border-gray-200 px-6 pb-4">
          <div className="flex gap-3">
            <input value={input} onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={loggedIn ? ("向" + (agent?.name || "老师") + "提问...") : "请先登录后使用AI对话"}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading} />
            <Button variant="primary" onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? "思考中..." : "发送"}
            </Button>
          </div>
          {!loggedIn ? (
            <p className="text-xs text-gray-400 mt-2 text-center">
              <a href="/login" className="text-blue-500 hover:underline">登录</a> 后即可开始AI对话，注册赠送3000积分
            </p>
          ) : null}
        </div>
      </div>

      <CreditRechargeModal open={showRecharge} balance={lowBalance} onClose={function() { setShowRecharge(false); }} />
    </div>
  );
}
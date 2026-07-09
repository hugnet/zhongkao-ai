'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SUBJECTS, AGENTS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal';
import { getSupabase } from '@/lib/supabase/client';

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; agentId?: string; tokenInfo?: any; }
interface HistoryItem { id: string; agent_id: string; title: string; messages: ChatMsg[]; updated_at: string; }

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
  var [credits, setCredits] = useState<number | null>(null);
  var messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(function() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(function() {
    var hasAcc = isLoggedIn();
    setLoggedIn(hasAcc);
    if (hasAcc) {
      var uid = localStorage.getItem('zhongkao_user_id');
      setUserId(uid);
      if (uid) {
        loadCredits(uid);
        loadHistories(uid);
      }
    }
  }, []);

  async function loadCredits(uid: string) {
    var sb = getSupabase();
    if (!sb) { setCredits(3000); return; }
    try {
      var { data } = await sb.from('credits').select('balance').eq('user_id', uid).single();
      if (data && data.balance !== undefined && data.balance !== null) {
        setCredits(data.balance);
      } else {
        var { error: insertErr } = await sb.from('credits').insert({ user_id: uid, balance: 3000 });
        setCredits(3000);
      }
    } catch(e) { setCredits(3000); }
  }

  async function deductCreditsLocal(uid: string, amount: number): Promise<number> {
    var sb = getSupabase();
    if (!sb) return (credits || 3000) - amount;
    try {
      var { data } = await sb.from('credits').select('balance').eq('user_id', uid).single();
      var current = data?.balance ?? 3000;
      var newBalance = current - amount;
      if (newBalance < 0) newBalance = 0;
      await sb.from('credits').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', uid);
      await sb.from('credit_transactions').insert({ user_id: uid, amount: -amount, type: 'deduct', description: 'AI对话消耗' });
      setCredits(newBalance);
      return newBalance;
    } catch(e) { return credits || 3000; }
  }

  async function loadHistories(uid: string) {
    var sb = getSupabase();
    if (!sb) return;
    try {
      var { data } = await sb.from('chat_history')
        .select('id, agent_id, title, messages, created_at, updated_at')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (data) {
        var items: HistoryItem[] = data.map(function(h: any) {
          return { id: String(h.id), agent_id: h.agent_id, title: h.title, messages: h.messages || [], updated_at: h.updated_at };
        });
        setHistories(items);
      }
    } catch(e) {}
  }

  async function saveHistoryToDB(uid: string, agentId: string, title: string, msgs: ChatMsg[], historyId?: string) {
    var sb = getSupabase();
    if (!sb) return;
    var payload = { user_id: uid, agent_id: agentId, title: title, messages: msgs.map(function(m) { return { role: m.role, content: m.content }; }), updated_at: new Date().toISOString() };
    try {
      if (historyId) {
        await sb.from('chat_history').update({ title: title, messages: payload.messages, updated_at: payload.updated_at }).eq('id', historyId).eq('user_id', uid);
      } else {
        var { data } = await sb.from('chat_history').insert({ user_id: uid, agent_id: agentId, title: title, messages: payload.messages }).select('id').single();
        if (data) {
          setCurrentHistoryId(String(data.id));
        }
      }
    } catch(e) {}
  }

  function startNewChat() {
    setMessages([]);
    setCurrentHistoryId(null);
  }

  function loadChat(h: HistoryItem) {
    setMessages(h.messages);
    setCurrentHistoryId(h.id);
  }

  var agent = AGENTS.find(function(a) { return a.id === currentAgent; });
  var subject = SUBJECTS.find(function(s) { return s.agentId === currentAgent; });

  async function handleSend() {
    if (!input.trim() || loading) return;

    if (!loggedIn) { window.location.href = '/login'; return; }
    if (credits !== null && credits < 1) { setLowBalance(0); setShowRecharge(true); return; }

    var userMsg: ChatMsg = { id: generateId(), role: 'user', content: input, agentId: currentAgent };
    var newMsgs = messages.concat(userMsg);
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      var sb = getSupabase();
      var token = '';
      if (sb) {
        var { data: sessionData } = await sb.auth.getSession();
        token = sessionData?.session?.access_token || '';
      }

      var res = await fetch('/api/chat/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(function(m) { return { role: m.role, content: m.content }; }).slice(-20),
          agentId: currentAgent,
          userId: userId,
          accessToken: token,
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

      if (data.usage && data.usage.credits_used && userId) {
        await deductCreditsLocal(userId, data.usage.credits_used);
      }

      var title = (newMsgs[0]?.content || '新对话').slice(0, 30);
      if (userId) {
        await saveHistoryToDB(userId, currentAgent, title, allMsgs, currentHistoryId || undefined);
        loadHistories(userId);
      }
    } catch(e: any) {
      var errorMsg = '网络错误：' + (e.message || '请检查网络');
      var allMsgs = newMsgs.concat([{ id: generateId(), role: 'assistant', content: errorMsg, agentId: currentAgent }]);
      setMessages(allMsgs);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-3">
          <Button variant="primary" className="w-full" onClick={startNewChat}>+ 新对话</Button>
        </div>
        <div className="px-3 pb-1">
          {SUBJECTS.map(function(sub) {
            return (
              <button key={sub.id} onClick={function() { setCurrentAgent(sub.agentId); startNewChat(); }}
                className={"w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 " + (currentAgent === sub.agentId ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50")}>
                <span>{sub.icon}</span><span>{sub.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-hidden flex flex-col px-3 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">历史对话</h3>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {histories.length === 0 ? (
              <p className="text-xs text-gray-300 px-1 py-4 text-center">暂无历史对话</p>
            ) : histories.map(function(h) {
              var a = AGENTS.find(function(ag) { return ag.id === h.agent_id; });
              var s = SUBJECTS.find(function(sub) { return sub.agentId === h.agent_id; });
              return (
                <button key={h.id} onClick={function() { loadChat(h); }}
                  className={"w-full text-left px-3 py-2 rounded-lg text-xs transition-colors " + (currentHistoryId === h.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50")}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm shrink-0">{s?.icon || '💬'}</span>
                    <span className="truncate font-medium">{h.title}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 pl-5">{a?.name || ''}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <span className={"font-bold text-sm " + ((credits || 0) < 100 ? 'text-red-500' : 'text-green-600')}>{credits !== null ? credits : '--'}</span>
            <span className="text-gray-400 text-xs">积分</span>
            {credits !== null && credits < 100 ? <button onClick={function() { setShowRecharge(true); }} className="text-xs text-blue-500 hover:underline">充值</button> : null}
          </div>
          <a href="/settings" className="block text-xs text-gray-400 hover:text-blue-600 px-2">&#9881; 设置</a>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 px-6 pt-4">
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
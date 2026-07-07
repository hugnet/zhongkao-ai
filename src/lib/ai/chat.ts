import { skillEngine } from '@/lib/skills/skillEngine';
import { getProvider, buildChatURL } from '@/lib/ai/providers';

/**
 * 发送AI聊天消息（支持多供应商）
 */
export async function sendChatMessage(
  messages: { role: string; content: string }[],
  agentId: string,
  apiKey: string,
  providerId?: string // 供应商ID，默认deepseek
): Promise<string> {
  var provider = getProvider(providerId || 'deepseek');
  if (!provider) provider = getProvider('deepseek')!;

  var systemPrompt = skillEngine.getSystemPrompt(agentId);
  var allMessages = [{ role: 'system', content: systemPrompt }];
  for (var i = Math.max(0, messages.length - 20); i < messages.length; i++) {
    allMessages.push(messages[i]);
  }

  var url = buildChatURL(provider);
  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: provider.model,
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error('API error: ' + res.status + ' ' + res.statusText);
  var data = await res.json();
  return data.choices?.[0]?.message?.content || '抱歉，暂时无法回答。';
}

/**
 * 生成学情诊断报告
 */
export async function generateDiagnosis(
  scores: Record<string, number>,
  targetScores: Record<string, number>,
  monthsToExam: number,
  apiKey: string,
  providerId?: string
): Promise<string> {
  var provider = getProvider(providerId || 'deepseek');
  if (!provider) provider = getProvider('deepseek')!;

  var subjects: Record<string, string> = { math:'数学', physics:'物理', chemistry:'化学', chinese:'语文', english:'英语' };
  var prompt = '你是中考学习策略教练策无遗老师。请生成学情诊断：\n\n';
  prompt += '各科当前成绩：\n';
  for (var [k,v] of Object.entries(scores)) { prompt += '  ' + (subjects[k]||k) + '：' + v + '分\n'; }
  prompt += '\n目标成绩：\n';
  for (var [k,v] of Object.entries(targetScores)) { prompt += '  ' + (subjects[k]||k) + '：' + v + '分\n'; }
  prompt += '\n距中考：' + monthsToExam + '个月';
  prompt += '\n\n输出格式：1.总体分析 2.各科诊断 3.冲刺计划 4.每日安排 5.策略建议';

  var url = buildChatURL(provider);
  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role:'system', content:'你是中考策略教练' },
        { role:'user', content:prompt },
      ],
      temperature:0.7,
      max_tokens:3000,
    }),
  });

  var data = await res.json();
  return data.choices?.[0]?.message?.content || '无法生成诊断报告。';
}
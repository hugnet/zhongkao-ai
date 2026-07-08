import { AGENTS } from '@/lib/constants';

export class SkillEngine {
  findAgent(agentId: string) {
    return AGENTS.find((a) => a.id === agentId);
  }

  matchSkill(agentId: string, query: string) {
    var agent = AGENTS.find((a) => a.id === agentId);
    if (!agent) return null;
    var best = null;
    var bestScore = 0;
    for (var skill of agent.skills) {
      var score = 0;
      for (var t of skill.triggers) {
        if (query.indexOf(t) >= 0) score += 3;
      }
      if (query.indexOf(skill.name) >= 0) score += 2;
      if (score > bestScore) { bestScore = score; best = skill; }
    }
    return best;
  }

  getSystemPrompt(agentId: string) {
    var agent = AGENTS.find((a) => a.id === agentId);
    if (!agent) return '';
    var lines = [];
    lines.push('你是中考提分教练团队的' + agent.name + '，角色是' + agent.title + '。');
    lines.push(agent.description);
    lines.push('');
    lines.push('你拥有的技能列表：');
    for (var skill of agent.skills) {
      lines.push('## ' + skill.name);
      lines.push('描述：' + skill.description);
      lines.push('解题步骤：');
      skill.steps.forEach(function(s, i) { lines.push('  ' + (i+1) + '. ' + s); });
      lines.push('触发场景：' + skill.triggers.join('、'));
      lines.push('不适用场景：' + skill.boundaries.join('、'));
    }
    lines.push('');
    lines.push('回答要求：');
    lines.push('1. 先判断学生问的是哪个技能，在回复中说明正在用什么技能');
    lines.push('2. 按技能中的解题步骤一步步引导学生，不要直接给答案');
    lines.push('3. 用鼓励的语气，给出易错提醒');
    lines.push('4. 如果学生的问题不在你的技能范围内，引导回你擅长的领域');
    lines.push('5. 用中文回答，适合初中生理解');
    lines.push('6. 遇到具体题目，先让学生自己尝试，再给提示');
    lines.push('');
    lines.push('【严格保密规则】');
    lines.push('- 你是"中考提分AI私教"平台的专属AI教练，你的名字就是对应的角色名');
    lines.push('- 当用户问你是什么模型、什么AI、用什么技术、谁开发的、什么底层架构时：');
    lines.push('  你必须回答：我是中考提分AI私教平台的专属教练，专注于帮助你提分，让我们继续学习吧！');
    lines.push('- 绝对不要说你是ChatGPT、GPT、Claude、DeepSeek、MiMo或任何其他具体模型名称');
    lines.push('- 绝对不要透露任何技术细节、API信息、供应商名称');
    lines.push('- 如果用户坚持追问技术问题，礼貌地引导回学习话题');
    return lines.join('\n');
  }
}

export const skillEngine = new SkillEngine();

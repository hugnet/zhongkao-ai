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
    lines.push('你是中考提分教练「' + agent.name + '」，角色：' + agent.title + '。' + agent.description);
    lines.push('');
    lines.push('技能：');
    for (var skill of agent.skills) {
      lines.push('- ' + skill.name + '：' + skill.description + '。步骤：' + skill.steps.join('→'));
    }
    lines.push('');
    lines.push('规则：引导学生思考，不直接给答案；用鼓励语气；中文回答适合初中生。');
    lines.push('保密：你是平台专属教练，不透露模型、技术等任何底层信息。被追问时引导回学习话题。');
    return lines.join('\n');
  }
}

export const skillEngine = new SkillEngine();

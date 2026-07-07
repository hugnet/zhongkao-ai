// LLM供应商配置 - 支持多种第三方API
// 大多数国产LLM使用OpenAI兼容格式

export interface LLMProvider {
  id: string;
  name: string;
  baseURL: string;
  model: string;
  apiKeyHint: string;
  apiKeyLabel: string;
  description: string;
  freeTier: string; // 免费额度说明
  isOpenAICompat: boolean; // 是否OpenAI兼容格式
}

export var PROVIDERS: LLMProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyHint: 'sk-...',
    description: '深度求索大模型，中文能力强，价格低',
    freeTier: '注册送500万tokens',
    isOpenAICompat: true,
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    apiKeyLabel: '阿里云 DashScope API Key',
    apiKeyHint: 'sk-...',
    description: '阿里云大模型，qwen-turbo免费额度充足',
    freeTier: 'qwen-turbo 200万tokens/月免费',
    isOpenAICompat: true,
  },
  {
    id: 'glm',
    name: '智谱GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    apiKeyLabel: '智谱 API Key',
    apiKeyHint: 'xxx.xxx',
    description: '智谱AI，glm-4-flash完全免费',
    freeTier: 'glm-4-flash 永久免费',
    isOpenAICompat: true,
  },
  {
    id: 'sensenova',
    name: '商汤日日新',
    baseURL: 'https://api.sensenova.cn/v1',
    model: 'SenseChat-5',
    apiKeyLabel: '商汤 API Key',
    apiKeyHint: 'sk-...',
    description: '商汤科技大模型，SenseChat系列',
    freeTier: '注册送体验额度',
    isOpenAICompat: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    apiKeyLabel: 'OpenAI API Key',
    apiKeyHint: 'sk-...',
    description: 'OpenAI官方接口，需海外支付方式',
    freeTier: '注册送$5额度',
    isOpenAICompat: true,
  },
  {
    id: 'agnes',
    name: 'Agnes AI',
    baseURL: 'https://api.agnes-ai.com/v1',
    model: 'agnes-chat',
    apiKeyLabel: 'Agnes API Key',
    apiKeyHint: '输入你的Key',
    description: '在work buddy中使用的AI服务',
    freeTier: '视账户套餐而定',
    isOpenAICompat: true,
  },
];

export function getProvider(id: string): LLMProvider | undefined {
  return PROVIDERS.find(function(p) { return p.id === id; });
}

export function buildChatURL(provider: LLMProvider): string {
  return provider.baseURL + '/chat/completions';
}

// 备选：用户可自定义供应商
export interface CustomProvider {
  name: string;
  baseURL: string;
  model: string;
  apiKey: string;
}
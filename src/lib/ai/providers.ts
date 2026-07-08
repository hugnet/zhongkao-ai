// AI供应商配置 - 支持多种第三方API

export interface LLMProvider {
  id: string;
  name: string;
  baseURL: string;
  model: string;
  apiKeyHint: string;
  apiKeyLabel: string;
  description: string;
  freeTier: string;
  isOpenAICompat: boolean;
  useResponsesApi?: boolean;
}

export var PROVIDERS: LLMProvider[] = [
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    baseURL: 'https://opencode.ai/zen/v1',
    model: 'DeepSeek-V4-Flash-Free',
    apiKeyLabel: 'OpenCode Zen API Key',
    apiKeyHint: 'sk-...',
    description: 'OpenCode Zen平台，内置多款免费模型',
    freeTier: 'MiMo/DeepSeek/Nemotron免费',
    isOpenAICompat: true,
    useResponsesApi: true,
  },
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
    apiKeyLabel: '阿里云DashScope API Key',
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
    freeTier: '注册送',
    isOpenAICompat: true,
  },
];

// OpenCode Zen 免费模型列表
export var ZEN_FREE_MODELS = [
  { id: 'MiMo-V2.5-Free', name: 'MiMo V2.5', desc: '小米推理模型' },
  { id: 'DeepSeek-V4-Flash-Free', name: 'DeepSeek V4 Flash', desc: '深度求索快速模型' },
  { id: 'Nemotron-3-UItra-Free', name: 'Nemotron 3 Ultra', desc: '英伟达大模型' },
];

export function getProvider(id: string): LLMProvider | undefined {
  return PROVIDERS.find(function(p) { return p.id === id; });
}

export function buildChatURL(provider: LLMProvider): string {
  if (provider.useResponsesApi) {
    return provider.baseURL + '/responses';
  }
  return provider.baseURL + '/chat/completions';
}

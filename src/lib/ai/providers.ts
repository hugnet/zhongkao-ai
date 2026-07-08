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
    name: 'PlatformAI',
    baseURL: 'https://opencode.ai/zen/v1',
    model: 'MiMo-V2.5-Free',
    apiKeyLabel: 'API Key',
    apiKeyHint: 'sk-...',
    description: '内置多模态AI，支持文本和图像理解',
    freeTier: '免费使用',
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
    description: '深度求索大模型',
    freeTier: '注册送500万tokens',
    isOpenAICompat: true,
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    apiKeyLabel: '阿里云 API Key',
    apiKeyHint: 'sk-...',
    description: '阿里云大模型',
    freeTier: '200万tokens/月免费',
    isOpenAICompat: true,
  },
  {
    id: 'glm',
    name: '智谱GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    apiKeyLabel: '智谱 API Key',
    apiKeyHint: 'xxx.xxx',
    description: '智谱AI',
    freeTier: 'glm-4-flash永久免费',
    isOpenAICompat: true,
  },
  {
    id: 'sensenova',
    name: '商汤日日新',
    baseURL: 'https://api.sensenova.cn/v1',
    model: 'SenseChat-5',
    apiKeyLabel: '商汤 API Key',
    apiKeyHint: 'sk-...',
    description: '商汤科技大模型',
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
    description: 'OpenAI官方接口',
    freeTier: '注册送',
    isOpenAICompat: true,
  },
];

export var ZEN_FREE_MODELS = [
  { id: 'MiMo-V2.5-Free', name: 'MiMo V2.5', desc: '多模态' },
  { id: 'DeepSeek-V4-Flash-Free', name: 'DeepSeek V4 Flash', desc: '快速' },
  { id: 'Nemotron-3-UItra-Free', name: 'Nemotron 3 Ultra', desc: '英伟达' },
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

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
    id: 'agnes',
    name: 'Agnes AI',
    baseURL: 'https://apihub.agnes-ai.com/v1',
    model: 'agnes-2.0-flash',
    apiKeyLabel: 'Agnes API Key',
    apiKeyHint: 'sk-...',
    description: '内置多模态AI',
    freeTier: '免费使用',
    isOpenAICompat: true,
  },
];

export function getProvider(id: string): LLMProvider | undefined {
  return PROVIDERS.find(function(p) { return p.id === id; });
}

export function buildChatURL(provider: LLMProvider): string {
  return provider.baseURL + '/chat/completions';
}
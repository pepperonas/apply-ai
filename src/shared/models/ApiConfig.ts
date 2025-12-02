export enum AIProvider {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude'
}

export interface ApiConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // Separate API Keys für jeden Provider
  chatgptApiKey?: string;
  claudeApiKey?: string;
  chatgptModel?: string;
  claudeModel?: string;
}


/**
 * Application constants
 */
export const CONSTANTS = {
  STORAGE_KEYS: {
    API_CONFIG: 'apiConfig',
    USER_PROFILE: 'userProfile',
  },
  DEFAULT_MODELS: {
    CHATGPT: 'gpt-4',
    // Claude 3 Haiku funktioniert zuverlässig (getestet Dezember 2025)
    CLAUDE: 'claude-3-haiku-20240307',
  },
  API_ENDPOINTS: {
    CHATGPT: 'https://api.openai.com/v1/chat/completions',
    CLAUDE: 'https://api.anthropic.com/v1/messages',
  },
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;


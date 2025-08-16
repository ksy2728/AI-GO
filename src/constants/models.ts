// Model-related constants
export const FEATURED_MODELS: readonly string[] = [
  'GPT-5',
  'o3',
  'o3-mini',
  'GPT-4.5',
  'gpt-oss-120b',
  'gpt-oss-20b',
  'Claude-3-Opus',
  'Claude-3.5-Sonnet',
  'Gemini-2.0-Flash',
  'Gemini-2.0-Pro',
  'Llama-3.3-70B'
]

export const MAJOR_PROVIDERS: readonly string[] = [
  'openai',
  'anthropic',
  'google',
  'meta',
  'microsoft',
  'amazon'
]

export const LATEST_MODELS: readonly string[] = [
  'GPT-5',
  'o3',
  'o3-mini',
  'GPT-4.5',
  'gpt-oss-120b',
  'gpt-oss-20b'
]

export const MODEL_LIMITS = {
  INITIAL_DISPLAY: 30,
  MAX_COMPARISON: 4,
  API_FETCH_LIMIT: 50,
  DEFAULT_SEARCH_LIMIT: 20
} as const

export const MODEL_BADGES = {
  NEW: {
    label: 'NEW',
    className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs'
  },
  FEATURED: {
    label: 'FEATURED',
    className: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs'
  }
} as const
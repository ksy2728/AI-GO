// Mock data for AI models - Updated January 2025
// Based on current market data and model releases

export const mockProviders = [
  {
    id: 'openai',
    slug: 'openai',
    name: 'OpenAI',
    logoUrl: 'https://openai.com/favicon.ico',
    websiteUrl: 'https://openai.com',
    statusPageUrl: 'https://status.openai.com',
    documentationUrl: 'https://platform.openai.com/docs',
    regions: ['us-east', 'us-west', 'eu-west', 'asia-east'],
    metadata: { icon: '🤖', color: '#00A67E' }
  },
  {
    id: 'anthropic',
    slug: 'anthropic',
    name: 'Anthropic',
    logoUrl: 'https://anthropic.com/favicon.ico',
    websiteUrl: 'https://anthropic.com',
    statusPageUrl: 'https://status.anthropic.com',
    documentationUrl: 'https://docs.anthropic.com',
    regions: ['us-east', 'us-west', 'eu-west'],
    metadata: { icon: '🧠', color: '#D97757' }
  },
  {
    id: 'google',
    slug: 'google',
    name: 'Google',
    logoUrl: 'https://google.com/favicon.ico',
    websiteUrl: 'https://ai.google',
    statusPageUrl: 'https://status.cloud.google.com',
    documentationUrl: 'https://ai.google.dev/docs',
    regions: ['us-east', 'us-west', 'eu-west', 'asia-east', 'asia-se'],
    metadata: { icon: '💎', color: '#4285F4' }
  },
  {
    id: 'meta',
    slug: 'meta',
    name: 'Meta',
    logoUrl: 'https://meta.com/favicon.ico',
    websiteUrl: 'https://ai.meta.com',
    documentationUrl: 'https://llama.meta.com',
    regions: ['us-east', 'us-west'],
    metadata: { icon: '🦙', color: '#0668E1' }
  },
  {
    id: 'mistral',
    slug: 'mistral',
    name: 'Mistral AI',
    logoUrl: 'https://mistral.ai/favicon.ico',
    websiteUrl: 'https://mistral.ai',
    documentationUrl: 'https://docs.mistral.ai',
    regions: ['eu-west', 'us-east'],
    metadata: { icon: '🌪️', color: '#FF7000' }
  },
  {
    id: 'cohere',
    slug: 'cohere',
    name: 'Cohere',
    logoUrl: 'https://cohere.com/favicon.ico',
    websiteUrl: 'https://cohere.com',
    documentationUrl: 'https://docs.cohere.com',
    regions: ['us-east', 'us-west'],
    metadata: { icon: '🎯', color: '#39594D' }
  },
  {
    id: 'alibaba',
    slug: 'alibaba',
    name: 'Alibaba Cloud',
    logoUrl: 'https://alibaba.com/favicon.ico',
    websiteUrl: 'https://www.alibabacloud.com/product/machine-learning',
    regions: ['asia-east', 'asia-se'],
    metadata: { icon: '☁️', color: '#FF6A00' }
  },
  {
    id: 'deepseek',
    slug: 'deepseek',
    name: 'DeepSeek',
    logoUrl: 'https://deepseek.com/favicon.ico',
    websiteUrl: 'https://deepseek.com',
    regions: ['asia-east'],
    metadata: { icon: '🔍', color: '#2E5BFF' }
  },
  {
    id: '01ai',
    slug: '01ai',
    name: '01.AI',
    logoUrl: 'https://01.ai/favicon.ico',
    websiteUrl: 'https://01.ai',
    regions: ['asia-east'],
    metadata: { icon: '🌟', color: '#8B5CF6' }
  },
  {
    id: 'amazon',
    slug: 'amazon',
    name: 'Amazon',
    logoUrl: 'https://aws.amazon.com/favicon.ico',
    websiteUrl: 'https://aws.amazon.com/bedrock',
    documentationUrl: 'https://docs.aws.amazon.com/bedrock',
    regions: ['us-east', 'us-west', 'eu-west', 'asia-east'],
    metadata: { icon: '📦', color: '#FF9900' }
  }
];

export const mockModels = [
  // OpenAI Models
  {
    providerId: 'openai',
    slug: 'gpt-4o',
    name: { 'en-US': 'GPT-4o', 'ko-KR': 'GPT-4o' },
    foundationModel: 'GPT-4',
    releasedAt: new Date('2024-05-13'),
    modalities: ['text', 'image', 'code'],
    capabilities: ['function_calling', 'streaming', 'vision', 'json_mode'],
    contextWindow: 128000,
    maxOutputTokens: 16384,
    trainingCutoff: new Date('2024-04-01'),
    apiVersion: '2024-02-01',
    metadata: {
      icon: '🤖',
      description: 'Most capable multimodal model optimized for speed and efficiency',
      usage: 28.5 // Usage percentage
    }
  },
  {
    providerId: 'openai',
    slug: 'gpt-4-turbo',
    name: { 'en-US': 'GPT-4 Turbo', 'ko-KR': 'GPT-4 터보' },
    foundationModel: 'GPT-4',
    releasedAt: new Date('2024-04-09'),
    modalities: ['text', 'image', 'code'],
    capabilities: ['function_calling', 'streaming', 'vision', 'json_mode'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2023-12-01'),
    apiVersion: '2024-02-01',
    metadata: {
      icon: '🤖',
      description: 'Latest GPT-4 Turbo with vision capabilities',
      usage: 12.3
    }
  },
  {
    providerId: 'openai',
    slug: 'gpt-4o-mini',
    name: { 'en-US': 'GPT-4o mini', 'ko-KR': 'GPT-4o 미니' },
    foundationModel: 'GPT-4',
    releasedAt: new Date('2024-07-18'),
    modalities: ['text', 'code'],
    capabilities: ['function_calling', 'streaming', 'json_mode'],
    contextWindow: 128000,
    maxOutputTokens: 16384,
    trainingCutoff: new Date('2023-10-01'),
    apiVersion: '2024-02-01',
    metadata: {
      icon: '🤖',
      description: 'Small, affordable, and intelligent model',
      usage: 8.7
    }
  },
  {
    providerId: 'openai',
    slug: 'gpt-3.5-turbo',
    name: { 'en-US': 'GPT-3.5 Turbo', 'ko-KR': 'GPT-3.5 터보' },
    foundationModel: 'GPT-3.5',
    releasedAt: new Date('2022-11-30'),
    modalities: ['text', 'code'],
    capabilities: ['function_calling', 'streaming'],
    contextWindow: 16385,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2021-09-01'),
    apiVersion: '2023-12-01',
    metadata: {
      icon: '🤖',
      description: 'Fast and cost-effective model for simple tasks',
      usage: 2.1
    }
  },

  // Anthropic Models
  {
    providerId: 'anthropic',
    slug: 'claude-3-5-sonnet',
    name: { 'en-US': 'Claude 3.5 Sonnet', 'ko-KR': 'Claude 3.5 Sonnet' },
    foundationModel: 'Claude 3.5',
    releasedAt: new Date('2024-10-22'),
    modalities: ['text', 'code', 'image'],
    capabilities: ['streaming', 'vision', 'computer_use'],
    contextWindow: 200000,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-04-01'),
    apiVersion: '2024-10-22',
    metadata: {
      icon: '🧠',
      description: 'Most intelligent Claude model with computer use capability',
      usage: 18.2
    }
  },
  {
    providerId: 'anthropic',
    slug: 'claude-3-opus',
    name: { 'en-US': 'Claude 3 Opus', 'ko-KR': 'Claude 3 Opus' },
    foundationModel: 'Claude 3',
    releasedAt: new Date('2024-03-04'),
    modalities: ['text', 'code', 'image'],
    capabilities: ['streaming', 'vision'],
    contextWindow: 200000,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2023-08-01'),
    apiVersion: '2024-02-01',
    metadata: {
      icon: '🧠',
      description: 'Most powerful model for highly complex tasks',
      usage: 6.5
    }
  },
  {
    providerId: 'anthropic',
    slug: 'claude-3-haiku',
    name: { 'en-US': 'Claude 3 Haiku', 'ko-KR': 'Claude 3 Haiku' },
    foundationModel: 'Claude 3',
    releasedAt: new Date('2024-03-13'),
    modalities: ['text', 'code', 'image'],
    capabilities: ['streaming', 'vision'],
    contextWindow: 200000,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2023-08-01'),
    apiVersion: '2024-02-01',
    metadata: {
      icon: '🧠',
      description: 'Fastest and most compact model for instant responses',
      usage: 3.1
    }
  },

  // Google Models
  {
    providerId: 'google',
    slug: 'gemini-2-0-flash',
    name: { 'en-US': 'Gemini 2.0 Flash', 'ko-KR': 'Gemini 2.0 Flash' },
    foundationModel: 'Gemini 2.0',
    releasedAt: new Date('2024-12-11'),
    modalities: ['text', 'image', 'video', 'audio', 'code'],
    capabilities: ['streaming', 'vision', 'multimodal_output', 'grounding'],
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-08-01'),
    apiVersion: '2024-12-01',
    metadata: {
      icon: '💎',
      description: 'Fastest multimodal model with native tool use',
      usage: 15.4
    }
  },
  {
    providerId: 'google',
    slug: 'gemini-1-5-pro',
    name: { 'en-US': 'Gemini 1.5 Pro', 'ko-KR': 'Gemini 1.5 Pro' },
    foundationModel: 'Gemini 1.5',
    releasedAt: new Date('2024-05-14'),
    modalities: ['text', 'image', 'video', 'audio', 'code'],
    capabilities: ['streaming', 'vision', 'multimodal_understanding'],
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-04-01'),
    apiVersion: '2024-05-01',
    metadata: {
      icon: '💎',
      description: 'Best performing model with 2M context window',
      usage: 5.8
    }
  },
  {
    providerId: 'google',
    slug: 'gemini-1-5-flash',
    name: { 'en-US': 'Gemini 1.5 Flash', 'ko-KR': 'Gemini 1.5 Flash' },
    foundationModel: 'Gemini 1.5',
    releasedAt: new Date('2024-05-14'),
    modalities: ['text', 'image', 'video', 'audio', 'code'],
    capabilities: ['streaming', 'vision', 'multimodal_understanding'],
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-04-01'),
    apiVersion: '2024-05-01',
    metadata: {
      icon: '💎',
      description: 'Fast and versatile multimodal model',
      usage: 4.2
    }
  },

  // Meta Models
  {
    providerId: 'meta',
    slug: 'llama-3-1-405b',
    name: { 'en-US': 'Llama 3.1 405B', 'ko-KR': 'Llama 3.1 405B' },
    foundationModel: 'Llama 3.1',
    releasedAt: new Date('2024-07-23'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'tool_use'],
    contextWindow: 128000,
    maxOutputTokens: 32768,
    trainingCutoff: new Date('2023-12-01'),
    metadata: {
      icon: '🦙',
      description: 'Largest open-source model rivaling GPT-4',
      usage: 3.8
    }
  },
  {
    providerId: 'meta',
    slug: 'llama-3-3-70b',
    name: { 'en-US': 'Llama 3.3 70B', 'ko-KR': 'Llama 3.3 70B' },
    foundationModel: 'Llama 3.3',
    releasedAt: new Date('2024-12-06'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'tool_use'],
    contextWindow: 128000,
    maxOutputTokens: 32768,
    trainingCutoff: new Date('2024-06-01'),
    metadata: {
      icon: '🦙',
      description: 'Latest efficient model matching 405B performance',
      usage: 2.4
    }
  },

  // Mistral Models
  {
    providerId: 'mistral',
    slug: 'mistral-large-2',
    name: { 'en-US': 'Mistral Large 2', 'ko-KR': 'Mistral Large 2' },
    foundationModel: 'Mistral Large',
    releasedAt: new Date('2024-07-24'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'function_calling', 'json_mode'],
    contextWindow: 128000,
    maxOutputTokens: 32768,
    trainingCutoff: new Date('2024-01-01'),
    metadata: {
      icon: '🌪️',
      description: 'Flagship model with 123B parameters',
      usage: 1.9
    }
  },
  {
    providerId: 'mistral',
    slug: 'mixtral-8x22b',
    name: { 'en-US': 'Mixtral 8x22B', 'ko-KR': 'Mixtral 8x22B' },
    foundationModel: 'Mixtral',
    releasedAt: new Date('2024-04-10'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'function_calling'],
    contextWindow: 65536,
    maxOutputTokens: 16384,
    trainingCutoff: new Date('2023-12-01'),
    metadata: {
      icon: '🌪️',
      description: 'Sparse Mixture of Experts model',
      usage: 0.8
    }
  },

  // Cohere Models
  {
    providerId: 'cohere',
    slug: 'command-r-plus',
    name: { 'en-US': 'Command R+', 'ko-KR': 'Command R+' },
    foundationModel: 'Command R',
    releasedAt: new Date('2024-04-04'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'rag', 'tool_use'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2023-12-01'),
    metadata: {
      icon: '🎯',
      description: 'Optimized for complex RAG workflows',
      usage: 1.2
    }
  },

  // Alibaba Models
  {
    providerId: 'alibaba',
    slug: 'qwen-2-5-72b',
    name: { 'en-US': 'Qwen 2.5 72B', 'ko-KR': 'Qwen 2.5 72B' },
    foundationModel: 'Qwen 2.5',
    releasedAt: new Date('2024-11-04'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'tool_use'],
    contextWindow: 131072,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-06-01'),
    metadata: {
      icon: '☁️',
      description: 'Leading Chinese-English bilingual model',
      usage: 1.5
    }
  },

  // DeepSeek Models
  {
    providerId: 'deepseek',
    slug: 'deepseek-v3',
    name: { 'en-US': 'DeepSeek V3', 'ko-KR': 'DeepSeek V3' },
    foundationModel: 'DeepSeek V3',
    releasedAt: new Date('2024-12-26'),
    modalities: ['text', 'code'],
    capabilities: ['streaming', 'tool_use'],
    contextWindow: 128000,
    maxOutputTokens: 8192,
    trainingCutoff: new Date('2024-08-01'),
    metadata: {
      icon: '🔍',
      description: 'Advanced MoE model with 671B parameters',
      usage: 1.0
    }
  },

  // 01.AI Models
  {
    providerId: '01ai',
    slug: 'yi-large',
    name: { 'en-US': 'Yi-Large', 'ko-KR': 'Yi-Large' },
    foundationModel: 'Yi',
    releasedAt: new Date('2024-03-06'),
    modalities: ['text', 'code'],
    capabilities: ['streaming'],
    contextWindow: 32768,
    maxOutputTokens: 4096,
    trainingCutoff: new Date('2023-12-01'),
    metadata: {
      icon: '🌟',
      description: 'High-performance bilingual model',
      usage: 0.7
    }
  },

  // Amazon Models
  {
    providerId: 'amazon',
    slug: 'amazon-nova-pro',
    name: { 'en-US': 'Amazon Nova Pro', 'ko-KR': 'Amazon Nova Pro' },
    foundationModel: 'Nova',
    releasedAt: new Date('2024-12-03'),
    modalities: ['text', 'image', 'video'],
    capabilities: ['streaming', 'vision', 'multimodal_understanding'],
    contextWindow: 300000,
    maxOutputTokens: 5120,
    trainingCutoff: new Date('2024-07-01'),
    metadata: {
      icon: '📦',
      description: 'Best price-performance multimodal model',
      usage: 0.9
    }
  }
];

// Mock pricing data
export const mockPricing = [
  // OpenAI
  { modelSlug: 'gpt-4o', tier: 'standard', inputPerMillion: 2.5, outputPerMillion: 10 },
  { modelSlug: 'gpt-4-turbo', tier: 'standard', inputPerMillion: 10, outputPerMillion: 30 },
  { modelSlug: 'gpt-4o-mini', tier: 'standard', inputPerMillion: 0.15, outputPerMillion: 0.6 },
  { modelSlug: 'gpt-3.5-turbo', tier: 'standard', inputPerMillion: 0.5, outputPerMillion: 1.5 },
  
  // Anthropic
  { modelSlug: 'claude-3-5-sonnet', tier: 'standard', inputPerMillion: 3, outputPerMillion: 15 },
  { modelSlug: 'claude-3-opus', tier: 'standard', inputPerMillion: 15, outputPerMillion: 75 },
  { modelSlug: 'claude-3-haiku', tier: 'standard', inputPerMillion: 0.25, outputPerMillion: 1.25 },
  
  // Google
  { modelSlug: 'gemini-2-0-flash', tier: 'standard', inputPerMillion: 0.075, outputPerMillion: 0.3 },
  { modelSlug: 'gemini-1-5-pro', tier: 'standard', inputPerMillion: 1.25, outputPerMillion: 5 },
  { modelSlug: 'gemini-1-5-flash', tier: 'standard', inputPerMillion: 0.075, outputPerMillion: 0.3 },
  
  // Others
  { modelSlug: 'llama-3-1-405b', tier: 'standard', inputPerMillion: 2.75, outputPerMillion: 2.75 },
  { modelSlug: 'llama-3-3-70b', tier: 'standard', inputPerMillion: 0.88, outputPerMillion: 0.88 },
  { modelSlug: 'mistral-large-2', tier: 'standard', inputPerMillion: 2, outputPerMillion: 6 },
  { modelSlug: 'mixtral-8x22b', tier: 'standard', inputPerMillion: 1.2, outputPerMillion: 1.2 },
  { modelSlug: 'command-r-plus', tier: 'standard', inputPerMillion: 2.5, outputPerMillion: 10 },
  { modelSlug: 'qwen-2-5-72b', tier: 'standard', inputPerMillion: 0.4, outputPerMillion: 0.4 },
  { modelSlug: 'deepseek-v3', tier: 'standard', inputPerMillion: 0.14, outputPerMillion: 0.28 },
  { modelSlug: 'yi-large', tier: 'standard', inputPerMillion: 3, outputPerMillion: 3 },
  { modelSlug: 'amazon-nova-pro', tier: 'standard', inputPerMillion: 0.8, outputPerMillion: 3.2 }
];

// Mock benchmark scores
export const mockBenchmarks = [
  // MMLU scores
  { modelSlug: 'gpt-4o', suite: 'mmlu', score: 88.7 },
  { modelSlug: 'gpt-4-turbo', suite: 'mmlu', score: 86.5 },
  { modelSlug: 'claude-3-5-sonnet', suite: 'mmlu', score: 88.3 },
  { modelSlug: 'claude-3-opus', suite: 'mmlu', score: 86.8 },
  { modelSlug: 'gemini-2-0-flash', suite: 'mmlu', score: 87.5 },
  { modelSlug: 'gemini-1-5-pro', suite: 'mmlu', score: 85.9 },
  { modelSlug: 'llama-3-1-405b', suite: 'mmlu', score: 85.2 },
  { modelSlug: 'llama-3-3-70b', suite: 'mmlu', score: 86.0 },
  { modelSlug: 'deepseek-v3', suite: 'mmlu', score: 87.5 },
  
  // HumanEval scores
  { modelSlug: 'gpt-4o', suite: 'humaneval', score: 90.2 },
  { modelSlug: 'claude-3-5-sonnet', suite: 'humaneval', score: 92.0 },
  { modelSlug: 'claude-3-opus', suite: 'humaneval', score: 84.9 },
  { modelSlug: 'gemini-2-0-flash', suite: 'humaneval', score: 85.7 },
  { modelSlug: 'deepseek-v3', suite: 'humaneval', score: 89.0 },
  
  // Arena ELO ratings
  { modelSlug: 'gpt-4o', suite: 'arena', score: 1286 },
  { modelSlug: 'claude-3-5-sonnet', suite: 'arena', score: 1271 },
  { modelSlug: 'gemini-2-0-flash', suite: 'arena', score: 1248 },
  { modelSlug: 'gpt-4-turbo', suite: 'arena', score: 1243 },
  { modelSlug: 'claude-3-opus', suite: 'arena', score: 1230 },
  { modelSlug: 'llama-3-1-405b', suite: 'arena', score: 1208 },
  { modelSlug: 'deepseek-v3', suite: 'arena', score: 1224 }
];

// Mock status data
export const generateMockStatus = (modelSlug: string) => {
  // Simulate realistic availability based on provider and model
  const baseAvailability: Record<string, number> = {
    'gpt-4o': 99.95,
    'gpt-4-turbo': 99.92,
    'gpt-4o-mini': 99.98,
    'gpt-3.5-turbo': 99.99,
    'claude-3-5-sonnet': 99.94,
    'claude-3-opus': 99.89,
    'claude-3-haiku': 99.96,
    'gemini-2-0-flash': 99.97,
    'gemini-1-5-pro': 99.90,
    'gemini-1-5-flash': 99.95,
    'llama-3-1-405b': 99.85,
    'llama-3-3-70b': 99.88,
    'mistral-large-2': 99.87,
    'deepseek-v3': 99.82,
    'amazon-nova-pro': 99.91
  };

  const availability = baseAvailability[modelSlug] || 99.5 + Math.random() * 0.49;
  const status = availability >= 99.5 ? 'operational' : availability >= 99 ? 'degraded' : 'outage';
  
  // Usage based on metadata
  const modelData = mockModels.find(m => m.slug === modelSlug);
  const usage = modelData?.metadata?.usage || Math.random() * 5;

  return {
    status,
    availability,
    latencyP50: Math.floor(50 + Math.random() * 100),
    latencyP95: Math.floor(100 + Math.random() * 200),
    latencyP99: Math.floor(200 + Math.random() * 300),
    errorRate: Math.max(0, (100 - availability) / 2),
    requestsPerMin: Math.floor(usage * 1000 + Math.random() * 500),
    tokensPerMin: Math.floor(usage * 50000 + Math.random() * 10000),
    usage
  };
};
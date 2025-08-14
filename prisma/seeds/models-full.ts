/**
 * Full AI Models Seed Data
 * Contains comprehensive data for all major AI models
 * Last updated: 2025-08-14
 */

export const fullModelsData = {
  // OpenAI Models
  openai: [
    {
      slug: 'openai-gpt-4o',
      name: 'GPT-4o',
      description: 'Most advanced multimodal flagship model',
      foundationModel: 'gpt-4o',
      releasedAt: new Date('2024-05-13'),
      modalities: ['text', 'vision', 'audio'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'function-calling', 'json-mode'],
      contextWindow: 128000,
      maxOutputTokens: 16384,
      trainingCutoff: new Date('2023-10-01'),
      apiVersion: '2024-08-06',
      pricing: {
        input: 2.50,  // per 1M tokens
        output: 10.00, // per 1M tokens
        cached_input: 1.25,
      },
      benchmarks: {
        mmlu: 88.7,
        humaneval: 90.2,
        gpqa: 53.6,
      }
    },
    {
      slug: 'openai-gpt-4o-mini',
      name: 'GPT-4o mini',
      description: 'Affordable small model for fast tasks',
      foundationModel: 'gpt-4o-mini',
      releasedAt: new Date('2024-07-18'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'function-calling'],
      contextWindow: 128000,
      maxOutputTokens: 16384,
      trainingCutoff: new Date('2023-10-01'),
      apiVersion: '2024-07-18',
      pricing: {
        input: 0.15,
        output: 0.60,
        cached_input: 0.075,
      },
      benchmarks: {
        mmlu: 82.0,
        humaneval: 87.2,
      }
    },
    {
      slug: 'openai-gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Previous generation flagship model',
      foundationModel: 'gpt-4-turbo-preview',
      releasedAt: new Date('2024-01-25'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'function-calling'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-12-01'),
      apiVersion: '2024-01-25',
      pricing: {
        input: 10.00,
        output: 30.00,
      },
      benchmarks: {
        mmlu: 86.5,
        humaneval: 85.4,
      }
    },
    {
      slug: 'openai-gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and cost-effective model',
      foundationModel: 'gpt-3.5-turbo-0125',
      releasedAt: new Date('2023-01-25'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding', 'function-calling'],
      contextWindow: 16385,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2021-09-01'),
      apiVersion: '2024-01-25',
      pricing: {
        input: 0.50,
        output: 1.50,
      },
      benchmarks: {
        mmlu: 70.0,
        humaneval: 48.1,
      }
    },
    {
      slug: 'openai-o1-preview',
      name: 'o1-preview',
      description: 'Reasoning model for complex tasks',
      foundationModel: 'o1-preview',
      releasedAt: new Date('2024-09-12'),
      modalities: ['text'],
      capabilities: ['reasoning', 'analysis', 'coding', 'math'],
      contextWindow: 128000,
      maxOutputTokens: 32768,
      trainingCutoff: new Date('2023-10-01'),
      apiVersion: '2024-09-12',
      pricing: {
        input: 15.00,
        output: 60.00,
      },
      benchmarks: {
        mmlu: 90.8,
        humaneval: 92.4,
        math: 94.8,
      }
    },
    {
      slug: 'openai-o1-mini',
      name: 'o1-mini',
      description: 'Faster reasoning model',
      foundationModel: 'o1-mini',
      releasedAt: new Date('2024-09-12'),
      modalities: ['text'],
      capabilities: ['reasoning', 'analysis', 'coding', 'math'],
      contextWindow: 128000,
      maxOutputTokens: 65536,
      trainingCutoff: new Date('2023-10-01'),
      apiVersion: '2024-09-12',
      pricing: {
        input: 3.00,
        output: 12.00,
      },
      benchmarks: {
        mmlu: 85.2,
        humaneval: 86.2,
        math: 90.0,
      }
    },
    {
      slug: 'openai-dall-e-3',
      name: 'DALL·E 3',
      description: 'Advanced text-to-image model',
      foundationModel: 'dall-e-3',
      releasedAt: new Date('2023-10-01'),
      modalities: ['image'],
      capabilities: ['image-generation', 'text-to-image'],
      pricing: {
        standard: 0.040, // per image 1024x1024
        hd: 0.080,       // per image 1024x1792 or 1792x1024
      }
    },
    {
      slug: 'openai-whisper-1',
      name: 'Whisper',
      description: 'Speech to text model',
      foundationModel: 'whisper-1',
      releasedAt: new Date('2023-03-01'),
      modalities: ['audio'],
      capabilities: ['speech-to-text', 'transcription', 'translation'],
      pricing: {
        minute: 0.006, // per minute
      }
    },
    {
      slug: 'openai-tts-1',
      name: 'TTS',
      description: 'Text to speech model',
      foundationModel: 'tts-1',
      releasedAt: new Date('2023-11-06'),
      modalities: ['audio'],
      capabilities: ['text-to-speech'],
      pricing: {
        character: 0.015, // per 1K characters
      }
    },
    {
      slug: 'openai-tts-1-hd',
      name: 'TTS HD',
      description: 'High quality text to speech',
      foundationModel: 'tts-1-hd',
      releasedAt: new Date('2023-11-06'),
      modalities: ['audio'],
      capabilities: ['text-to-speech'],
      pricing: {
        character: 0.030, // per 1K characters
      }
    }
  ],

  // Anthropic Models
  anthropic: [
    {
      slug: 'anthropic-claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Most intelligent model from Anthropic',
      foundationModel: 'claude-3-5-sonnet-20241022',
      releasedAt: new Date('2024-10-22'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'computer-use'],
      contextWindow: 200000,
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-04-01'),
      apiVersion: '2024-10-22',
      pricing: {
        input: 3.00,
        output: 15.00,
        cached_input: 0.30,
        cached_output: 1.50,
      },
      benchmarks: {
        mmlu: 88.7,
        humaneval: 92.0,
        gpqa: 59.4,
      }
    },
    {
      slug: 'anthropic-claude-3.5-haiku',
      name: 'Claude 3.5 Haiku',
      description: 'Fast and affordable model',
      foundationModel: 'claude-3-5-haiku-20241022',
      releasedAt: new Date('2024-11-04'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding'],
      contextWindow: 200000,
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-07-01'),
      apiVersion: '2024-11-04',
      pricing: {
        input: 1.00,
        output: 5.00,
        cached_input: 0.10,
        cached_output: 0.50,
      },
      benchmarks: {
        mmlu: 85.1,
        humaneval: 88.1,
      }
    },
    {
      slug: 'anthropic-claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Powerful model for complex tasks',
      foundationModel: 'claude-3-opus-20240229',
      releasedAt: new Date('2024-03-04'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 200000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-08-01'),
      apiVersion: '2024-02-29',
      pricing: {
        input: 15.00,
        output: 75.00,
        cached_input: 1.50,
        cached_output: 7.50,
      },
      benchmarks: {
        mmlu: 86.8,
        humaneval: 84.9,
        gpqa: 50.4,
      }
    },
    {
      slug: 'anthropic-claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and cost',
      foundationModel: 'claude-3-sonnet-20240229',
      releasedAt: new Date('2024-03-04'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 200000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-08-01'),
      apiVersion: '2024-02-29',
      pricing: {
        input: 3.00,
        output: 15.00,
        cached_input: 0.30,
        cached_output: 1.50,
      },
      benchmarks: {
        mmlu: 79.0,
        humaneval: 73.0,
      }
    },
    {
      slug: 'anthropic-claude-3-haiku',
      name: 'Claude 3 Haiku',
      description: 'Fastest Claude 3 model',
      foundationModel: 'claude-3-haiku-20240307',
      releasedAt: new Date('2024-03-07'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 200000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-08-01'),
      apiVersion: '2024-03-07',
      pricing: {
        input: 0.25,
        output: 1.25,
        cached_input: 0.03,
        cached_output: 0.15,
      },
      benchmarks: {
        mmlu: 75.2,
        humaneval: 75.9,
      }
    }
  ],

  // Google Models
  google: [
    {
      slug: 'google-gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Advanced multimodal model with long context',
      foundationModel: 'gemini-1.5-pro-002',
      releasedAt: new Date('2024-05-14'),
      modalities: ['text', 'vision', 'audio', 'video'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'audio', 'video'],
      contextWindow: 2000000, // 2M tokens
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-05-01'),
      apiVersion: '002',
      pricing: {
        input_128k: 1.25,
        output_128k: 5.00,
        input_128k_plus: 2.50,
        output_128k_plus: 10.00,
        cached_input: 0.3125,
      },
      benchmarks: {
        mmlu: 85.9,
        humaneval: 84.1,
      }
    },
    {
      slug: 'google-gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast multimodal model',
      foundationModel: 'gemini-1.5-flash-002',
      releasedAt: new Date('2024-09-24'),
      modalities: ['text', 'vision', 'audio', 'video'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'audio', 'video'],
      contextWindow: 1000000, // 1M tokens
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-05-01'),
      apiVersion: '002',
      pricing: {
        input_128k: 0.075,
        output_128k: 0.30,
        input_128k_plus: 0.15,
        output_128k_plus: 0.60,
        cached_input: 0.01875,
      },
      benchmarks: {
        mmlu: 78.9,
        humaneval: 74.3,
      }
    },
    {
      slug: 'google-gemini-1.5-flash-8b',
      name: 'Gemini 1.5 Flash-8B',
      description: 'Small and fast multimodal model',
      foundationModel: 'gemini-1.5-flash-8b',
      releasedAt: new Date('2024-10-03'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-05-01'),
      apiVersion: 'latest',
      pricing: {
        input_128k: 0.0375,
        output_128k: 0.15,
        input_128k_plus: 0.075,
        output_128k_plus: 0.30,
        cached_input: 0.01,
      },
      benchmarks: {
        mmlu: 71.5,
        humaneval: 61.8,
      }
    },
    {
      slug: 'google-gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      description: 'Next-gen experimental multimodal model',
      foundationModel: 'gemini-2.0-flash-exp',
      releasedAt: new Date('2024-12-11'),
      modalities: ['text', 'vision', 'audio'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'audio', 'multimodal-live'],
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-11-01'),
      apiVersion: 'experimental',
      pricing: {
        free_tier: true, // Free during experimental phase
      },
      benchmarks: {
        mmlu: 82.5, // Estimated
      }
    },
    {
      slug: 'google-gemini-exp-1206',
      name: 'Gemini Experimental 1206',
      description: 'Experimental model with enhanced reasoning',
      foundationModel: 'gemini-exp-1206',
      releasedAt: new Date('2024-12-06'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding', 'reasoning'],
      contextWindow: 2000000,
      maxOutputTokens: 8192,
      trainingCutoff: new Date('2024-11-01'),
      apiVersion: 'experimental',
      pricing: {
        free_tier: true, // Free during experimental phase
      },
      benchmarks: {
        mmlu: 87.0, // Estimated
      }
    }
  ],

  // Meta Models
  meta: [
    {
      slug: 'meta-llama-3.1-405b',
      name: 'Llama 3.1 405B',
      description: 'Largest open-source model',
      foundationModel: 'llama-3.1-405b-instruct',
      releasedAt: new Date('2024-07-23'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding', 'multilingual'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-12-01'),
      apiVersion: '3.1',
      isOpenSource: true,
      benchmarks: {
        mmlu: 88.6,
        humaneval: 89.0,
        gsm8k: 96.8,
      }
    },
    {
      slug: 'meta-llama-3.1-70b',
      name: 'Llama 3.1 70B',
      description: 'Large open model with strong performance',
      foundationModel: 'llama-3.1-70b-instruct',
      releasedAt: new Date('2024-07-23'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding', 'multilingual'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-12-01'),
      apiVersion: '3.1',
      isOpenSource: true,
      benchmarks: {
        mmlu: 86.0,
        humaneval: 80.5,
        gsm8k: 95.1,
      }
    },
    {
      slug: 'meta-llama-3.1-8b',
      name: 'Llama 3.1 8B',
      description: 'Efficient open model',
      foundationModel: 'llama-3.1-8b-instruct',
      releasedAt: new Date('2024-07-23'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding', 'multilingual'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2023-12-01'),
      apiVersion: '3.1',
      isOpenSource: true,
      benchmarks: {
        mmlu: 69.4,
        humaneval: 72.6,
        gsm8k: 84.5,
      }
    },
    {
      slug: 'meta-llama-3.2-90b-vision',
      name: 'Llama 3.2 90B Vision',
      description: 'Multimodal open model',
      foundationModel: 'llama-3.2-90b-vision-instruct',
      releasedAt: new Date('2024-09-25'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2024-06-01'),
      apiVersion: '3.2',
      isOpenSource: true,
      benchmarks: {
        mmlu: 83.3,
        humaneval: 75.1,
      }
    },
    {
      slug: 'meta-llama-3.2-11b-vision',
      name: 'Llama 3.2 11B Vision',
      description: 'Efficient multimodal model',
      foundationModel: 'llama-3.2-11b-vision-instruct',
      releasedAt: new Date('2024-09-25'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2024-06-01'),
      apiVersion: '3.2',
      isOpenSource: true,
      benchmarks: {
        mmlu: 73.0,
        humaneval: 65.2,
      }
    },
    {
      slug: 'meta-llama-3.2-3b',
      name: 'Llama 3.2 3B',
      description: 'Lightweight model for edge devices',
      foundationModel: 'llama-3.2-3b-instruct',
      releasedAt: new Date('2024-09-25'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2024-06-01'),
      apiVersion: '3.2',
      isOpenSource: true,
      benchmarks: {
        mmlu: 63.4,
        humaneval: 61.5,
      }
    },
    {
      slug: 'meta-llama-3.2-1b',
      name: 'Llama 3.2 1B',
      description: 'Ultra-lightweight model',
      foundationModel: 'llama-3.2-1b-instruct',
      releasedAt: new Date('2024-09-25'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      trainingCutoff: new Date('2024-06-01'),
      apiVersion: '3.2',
      isOpenSource: true,
      benchmarks: {
        mmlu: 49.3,
        humaneval: 41.5,
      }
    }
  ],

  // Microsoft Models
  microsoft: [
    {
      slug: 'microsoft-phi-3-medium',
      name: 'Phi-3 Medium',
      description: 'Efficient small language model',
      foundationModel: 'phi-3-medium-128k-instruct',
      releasedAt: new Date('2024-05-21'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      isOpenSource: true,
      benchmarks: {
        mmlu: 78.2,
        humaneval: 62.2,
      }
    },
    {
      slug: 'microsoft-phi-3-mini',
      name: 'Phi-3 Mini',
      description: 'Tiny but capable model',
      foundationModel: 'phi-3-mini-128k-instruct',
      releasedAt: new Date('2024-04-23'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding'],
      contextWindow: 128000,
      maxOutputTokens: 4096,
      isOpenSource: true,
      benchmarks: {
        mmlu: 68.1,
        humaneval: 58.5,
      }
    }
  ],

  // Mistral Models
  mistral: [
    {
      slug: 'mistral-large',
      name: 'Mistral Large',
      description: 'Flagship reasoning model',
      foundationModel: 'mistral-large-2411',
      releasedAt: new Date('2024-11-01'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'function-calling'],
      contextWindow: 128000,
      maxOutputTokens: 32768,
      apiVersion: '2411',
      pricing: {
        input: 2.00,
        output: 6.00,
      },
      benchmarks: {
        mmlu: 84.0,
        humaneval: 88.0,
      }
    },
    {
      slug: 'mistral-pixtral-large',
      name: 'Pixtral Large',
      description: 'Multimodal frontier model',
      foundationModel: 'pixtral-large-2411',
      releasedAt: new Date('2024-11-18'),
      modalities: ['text', 'vision'],
      capabilities: ['chat', 'analysis', 'coding', 'vision'],
      contextWindow: 128000,
      maxOutputTokens: 32768,
      apiVersion: '2411',
      pricing: {
        input: 2.00,
        output: 6.00,
      },
      benchmarks: {
        mmlu: 86.7,
      }
    },
    {
      slug: 'mistral-small',
      name: 'Mistral Small',
      description: 'Cost-efficient reasoning model',
      foundationModel: 'mistral-small-2409',
      releasedAt: new Date('2024-09-01'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis', 'coding', 'function-calling'],
      contextWindow: 32000,
      maxOutputTokens: 8192,
      apiVersion: '2409',
      pricing: {
        input: 0.20,
        output: 0.60,
      },
      benchmarks: {
        mmlu: 72.2,
        humaneval: 81.3,
      }
    },
    {
      slug: 'mistral-codestral',
      name: 'Codestral',
      description: 'Code generation specialist',
      foundationModel: 'codestral-2405',
      releasedAt: new Date('2024-05-29'),
      modalities: ['text'],
      capabilities: ['coding', 'code-completion', 'analysis'],
      contextWindow: 32000,
      maxOutputTokens: 8192,
      apiVersion: '2405',
      pricing: {
        input: 0.20,
        output: 0.60,
      },
      benchmarks: {
        humaneval: 91.4,
      }
    }
  ],

  // Amazon Models
  amazon: [
    {
      slug: 'amazon-nova-pro',
      name: 'Amazon Nova Pro',
      description: 'Highly capable multimodal model',
      foundationModel: 'nova-pro-v1',
      releasedAt: new Date('2024-12-03'),
      modalities: ['text', 'vision', 'video'],
      capabilities: ['chat', 'analysis', 'coding', 'vision', 'video'],
      contextWindow: 300000,
      maxOutputTokens: 5120,
      pricing: {
        input: 0.80,
        output: 3.20,
      },
      benchmarks: {
        mmlu: 73.3,
        humaneval: 70.1,
      }
    },
    {
      slug: 'amazon-nova-lite',
      name: 'Amazon Nova Lite',
      description: 'Fast and cost-effective model',
      foundationModel: 'nova-lite-v1',
      releasedAt: new Date('2024-12-03'),
      modalities: ['text', 'vision', 'video'],
      capabilities: ['chat', 'analysis', 'vision', 'video'],
      contextWindow: 300000,
      maxOutputTokens: 5120,
      pricing: {
        input: 0.06,
        output: 0.24,
      },
      benchmarks: {
        mmlu: 64.9,
        humaneval: 62.2,
      }
    },
    {
      slug: 'amazon-nova-micro',
      name: 'Amazon Nova Micro',
      description: 'Ultra-fast text model',
      foundationModel: 'nova-micro-v1',
      releasedAt: new Date('2024-12-03'),
      modalities: ['text'],
      capabilities: ['chat', 'analysis'],
      contextWindow: 128000,
      maxOutputTokens: 5120,
      pricing: {
        input: 0.035,
        output: 0.14,
      },
      benchmarks: {
        mmlu: 60.9,
        humaneval: 58.8,
      }
    }
  ]
}

// Helper function to prepare data for database insertion
export function prepareModelsForDatabase() {
  const allModels = []
  
  for (const [provider, models] of Object.entries(fullModelsData)) {
    for (const model of models) {
      allModels.push({
        ...model,
        provider,
        metadata: {
          pricing: (model as any).pricing || {},
          benchmarks: (model as any).benchmarks || {},
          isOpenSource: (model as any).isOpenSource || false,
        }
      })
    }
  }
  
  return allModels
}

// Export for use in seed scripts
export default fullModelsData
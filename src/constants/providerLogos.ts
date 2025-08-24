/**
 * Provider Logo Mappings
 * Central repository for AI provider logo URLs
 */

export type ProviderLogoMap = {
  [key: string]: string
}

export const PROVIDER_LOGOS: ProviderLogoMap = {
  // Major Providers
  'OpenAI': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
  'Anthropic': 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
  'Google': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  'Meta': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
  'Mistral AI': 'https://mistral.ai/images/logo.png',
  
  // Additional Providers
  'Microsoft': 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
  'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  'Cohere': 'https://cohere.com/favicon.svg',
  'Perplexity': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Perplexity_AI_logo.png',
  'xAI': 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png',
  'Alibaba': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Alibaba-logo-en.svg',
  'Baidu': 'https://upload.wikimedia.org/wikipedia/commons/2/20/Baidu_logo.svg',
  'DeepSeek': '/logos/deepseek.svg',
  'Together AI': '/logos/together.svg',
  'Replicate': '/logos/replicate.svg',
  'Hugging Face': 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg',
  'Stability AI': '/logos/stability.svg',
  'AI21 Labs': '/logos/ai21.svg',
  'Fireworks AI': '/logos/fireworks.svg',
  
  // Alternative names
  'Google DeepMind': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  'Meta AI': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
  'Microsoft Azure': 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
  'Amazon Bedrock': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
}

/**
 * Get provider logo URL with fallback
 * @param provider - Provider name
 * @returns Logo URL or null if not found
 */
export function getProviderLogo(provider: string): string | null {
  if (!provider) return null
  
  // Direct match
  if (PROVIDER_LOGOS[provider]) {
    return PROVIDER_LOGOS[provider]
  }
  
  // Case-insensitive match
  const lowerProvider = provider.toLowerCase()
  const match = Object.keys(PROVIDER_LOGOS).find(
    key => key.toLowerCase() === lowerProvider
  )
  
  return match ? PROVIDER_LOGOS[match] : null
}

/**
 * Get provider logo with safe fallback
 * @param provider - Provider name
 * @param fallbackUrl - Optional fallback URL
 * @returns Logo URL, fallback URL, or null
 */
export function getProviderLogoSafe(
  provider: string,
  fallbackUrl?: string
): string | null {
  return getProviderLogo(provider) || fallbackUrl || null
}
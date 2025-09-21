'use client'

import { useState, useEffect } from 'react'
import { FeaturedModelCard } from '@/components/dashboard/FeaturedModelCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { Skeleton } from '@/components/ui/skeleton'
import { getProviderLogo } from '@/constants/providerLogos'
import { TrendingUp } from 'lucide-react'

// Full 9 models data matching the original
const fallbackModels = [
  {
    id: 'gpt-5-high',
    rank: 1,
    name: 'GPT-5 (High)',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: 'operational' as const,
    availability: 99.95,
    responseTime: 200,
    errorRate: 0.02,
    throughput: 1100,
    description: 'Most advanced GPT-5 variant with maximum intelligence',
    capabilities: ['Text Generation', 'Vision', 'Advanced Reasoning', 'Code', 'Real-time Thinking'],
    intelligenceIndex: 68.95
  },
  {
    id: 'gpt-5-medium',
    rank: 2,
    name: 'GPT-5 (Medium)',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: 'operational' as const,
    availability: 99.9,
    responseTime: 180,
    errorRate: 0.03,
    throughput: 1200,
    description: 'Balanced GPT-5 with excellent performance',
    capabilities: ['Text Generation', 'Vision', 'Advanced Reasoning', 'Code'],
    intelligenceIndex: 67.53
  },
  {
    id: 'o3',
    rank: 3,
    name: 'o3',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: 'operational' as const,
    availability: 99.8,
    responseTime: 220,
    errorRate: 0.04,
    throughput: 950,
    description: 'Advanced reasoning model with chain-of-thought',
    capabilities: ['Text Generation', 'Complex Reasoning', 'Mathematics', 'Code'],
    intelligenceIndex: 67.07
  },
  {
    id: 'claude-3-opus',
    rank: 4,
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    status: 'operational' as const,
    availability: 99.8,
    responseTime: 320,
    errorRate: 0.03,
    throughput: 720,
    description: 'Most powerful Claude model for complex tasks',
    capabilities: ['Text Generation', 'Vision', 'Long Context', 'Code', 'Constitutional AI'],
    intelligenceIndex: 66.8
  },
  {
    id: 'claude-3-7-sonnet',
    rank: 5,
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    status: 'operational' as const,
    availability: 99.7,
    responseTime: 200,
    errorRate: 0.04,
    throughput: 900,
    description: 'Latest hybrid reasoning model with advanced capabilities',
    capabilities: ['Text Generation', 'Hybrid Reasoning', 'Vision', 'Code'],
    intelligenceIndex: 66.5
  },
  {
    id: 'gemini-2-5-pro',
    rank: 6,
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    status: 'operational' as const,
    availability: 99.5,
    responseTime: 280,
    errorRate: 0.06,
    throughput: 750,
    description: 'Google\'s most advanced multimodal model',
    capabilities: ['Text Generation', 'Vision', 'Audio', 'Video', '2M Token Context'],
    intelligenceIndex: 65.2
  },
  {
    id: 'gemini-2-0-flash',
    rank: 7,
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    status: 'operational' as const,
    availability: 99.6,
    responseTime: 150,
    errorRate: 0.05,
    throughput: 1000,
    description: 'Fast and efficient model for real-time applications',
    capabilities: ['Text Generation', 'Vision', 'Fast Response', 'Multimodal'],
    intelligenceIndex: 63.4
  },
  {
    id: 'llama-3-1-405b',
    rank: 8,
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    status: 'operational' as const,
    availability: 98.9,
    responseTime: 300,
    errorRate: 0.08,
    throughput: 600,
    description: 'Most powerful open-source model available',
    capabilities: ['Text Generation', 'Code', 'Multilingual', 'Open Source', '128K Context'],
    intelligenceIndex: 62.8
  },
  {
    id: 'mistral-large',
    rank: 9,
    name: 'Mistral Large',
    provider: 'Mistral AI',
    providerLogo: 'https://mistral.ai/images/logo.png',
    status: 'operational' as const,
    availability: 99.2,
    responseTime: 220,
    errorRate: 0.07,
    throughput: 780,
    description: 'Europe\'s leading AI model with strong multilingual support',
    capabilities: ['Text Generation', 'Code', 'Function Calling', '32K Context', 'Multilingual'],
    intelligenceIndex: 61.5
  }
]

export default function DashboardPage() {
  const { t } = useLanguage()
  const [featuredModels, setFeaturedModels] = useState(fallbackModels)
  const [dataSource, setDataSource] = useState<'live' | 'cached' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real Intelligence Index data from Artificial Analysis
  useEffect(() => {
    const fetchIntelligenceData = async () => {
      try {
        const response = await fetch('/api/v1/intelligence-index?limit=9')
        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()

        if (data.models && data.models.length > 0) {
          // Map the API data to match our model structure
          const mappedModels = data.models.map((model: any) => ({
            id: model.id || model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            rank: model.rank,
            name: model.name,
            provider: model.provider,
            providerLogo: getProviderLogo(model.provider) || model.providerLogo,
            status: 'operational' as const,
            availability: 99.5,
            responseTime: 250,
            errorRate: 0.03,
            throughput: 800,
            description: `${model.provider}'s advanced AI model with Intelligence Index of ${model.intelligenceIndex}`,
            capabilities: ['Text Generation', 'Advanced Reasoning'],
            intelligenceIndex: model.intelligenceIndex
          }))

          setFeaturedModels(mappedModels)
          setDataSource(data.cached ? 'cached' : 'live')
        }
      } catch (error) {
        console.warn('Failed to fetch Intelligence Index data, using fallback:', error)
        // Keep using fallback models
      } finally {
        setIsLoading(false)
      }
    }

    fetchIntelligenceData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-700 font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Models Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900">
                Top {featuredModels.length} AI Models from Leading Providers
              </h2>
            </div>
            <div className="text-xs text-gray-500">
              Source: Artificial Analysis Intelligence Index • Updated: {new Date().toLocaleDateString()} • {dataSource === 'live' ? '✅ Live' : dataSource === 'cached' ? '📊 Cached' : 'Fallback'} • Models: {featuredModels.length}
            </div>
          </div>

          {/* Featured Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredModels.map((model: any) => (
              <FeaturedModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
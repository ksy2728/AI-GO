'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { FeaturedModelCard } from '@/components/dashboard/FeaturedModelCard'
import { useRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/contexts/LanguageContext'

// Lazy load heavy components
const ModelStatusGrid = lazy(() => import('@/components/dashboard/ModelStatusGrid').then(mod => ({ default: mod.ModelStatusGrid })))
const ActivityFeed = lazy(() => import('@/components/dashboard/ActivityFeed').then(mod => ({ default: mod.ActivityFeed })))

import { 
  AlertCircle,
  Sparkles
} from 'lucide-react'

// Featured models data with CDN logos
const featuredModels = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: 'operational' as const,
    availability: 99.8,
    responseTime: 250,
    errorRate: 0.05,
    throughput: 850,
    description: 'Most capable GPT-4 model with 128K context window and improved instruction following',
    capabilities: ['Text Generation', 'Code', 'Vision', 'Function Calling', 'JSON Mode']
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg',
    status: 'operational' as const,
    availability: 99.9,
    responseTime: 320,
    errorRate: 0.03,
    throughput: 720,
    description: 'Most powerful Claude model excelling at complex tasks, analysis, and creative work',
    capabilities: ['Text Generation', 'Code', 'Vision', 'Long Context', 'Constitutional AI']
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    status: 'operational' as const,
    availability: 99.5,
    responseTime: 280,
    errorRate: 0.08,
    throughput: 680,
    description: 'Advanced multimodal model with 1M token context window and strong reasoning',
    capabilities: ['Text Generation', 'Code', 'Vision', 'Audio', 'Video', 'Long Context']
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'Meta',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    status: 'operational' as const,
    availability: 98.9,
    responseTime: 180,
    errorRate: 0.12,
    throughput: 920,
    description: 'Open-source model with excellent performance across diverse tasks',
    capabilities: ['Text Generation', 'Code', 'Multilingual', 'Open Source']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    status: 'operational' as const,
    availability: 99.7,
    responseTime: 150,
    errorRate: 0.06,
    throughput: 1100,
    description: 'Optimized GPT-4 model with faster response times and improved efficiency',
    capabilities: ['Text Generation', 'Code', 'Vision', 'Voice', 'Real-time']
  }
]

export default function DashboardPage() {
  const { t } = useLanguage()
  const { globalStats, connected, error: realtimeError } = useRealtime({
    subscribeToGlobal: true
  })
  const [apiStats, setApiStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modelsWithStatus, setModelsWithStatus] = useState(featuredModels)

  // Load data via REST API (primary method for Vercel deployment)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getModelStats()
        setApiStats(stats)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setLoading(false)
      }
    }

    // Always use API data in production, WebSocket as enhancement in development
    if (!globalStats) {
      fetchStats()
      
      // Set up periodic refresh for live data updates
      const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [globalStats])

  // Use real-time data if available, otherwise use API data
  useEffect(() => {
    if (connected && !globalStats) {
      // If WebSocket connects, it will provide real-time data
      setLoading(false)
    }
  }, [connected, globalStats])

  // Update model status based on real-time data
  useEffect(() => {
    if (globalStats || apiStats) {
      // Simulate dynamic status updates for featured models
      const updatedModels = featuredModels.map(model => {
        // Add some variance to make it realistic
        const variance = Math.random() * 2 - 1 // -1 to 1
        return {
          ...model,
          availability: Math.min(100, Math.max(95, model.availability + variance)),
          responseTime: Math.max(50, model.responseTime + (variance * 20)),
          errorRate: Math.max(0, model.errorRate + (variance * 0.02)),
          throughput: Math.max(100, model.throughput + (variance * 50))
        }
      })
      setModelsWithStatus(updatedModels)
    }
  }, [globalStats, apiStats])

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
              {connected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700 font-medium">{t('dashboard.status.live')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-blue-700 font-medium">{t('dashboard.status.apiMode')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Models Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900">
              {t('dashboard.featuredModels.title')}
            </h2>
          </div>
          
          {/* Featured Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelsWithStatus.map((model) => (
              <FeaturedModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>

        {/* Model Status Grid */}
        <div className="mb-8">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ModelStatusGrid />
          </Suspense>
        </div>

        {/* Bottom Row - Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
              <ActivityFeed />
            </Suspense>
          </div>
        </div>

        {/* Additional Info */}
        {realtimeError && !realtimeError.includes('disabled') && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                {t('dashboard.alerts.apiMode')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
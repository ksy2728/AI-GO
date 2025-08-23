'use client'

import { useEffect, useState } from 'react'
import { FeaturedModelCard } from '@/components/dashboard/FeaturedModelCard'
import { useLanguage } from '@/contexts/LanguageContext'

// Simplified fallback models data
const fallbackModels = [
  {
    id: 'gpt-4o',
    rank: 1,
    name: 'GPT-4o',
    provider: 'OpenAI',
    status: 'operational' as const,
    availability: 99.6,
    responseTime: 243,
    errorRate: 0.04,
    throughput: 833,
    description: 'Most advanced GPT-4 model with optimized performance',
    capabilities: ['Text Generation', 'Vision', 'Advanced Reasoning'],
    intelligenceIndex: 85.2
  },
  {
    id: 'claude-3-opus',
    rank: 2,
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    status: 'operational' as const,
    availability: 98.8,
    responseTime: 300,
    errorRate: 0.01,
    throughput: 670,
    description: 'Most powerful Claude model for complex tasks',
    capabilities: ['Text Generation', 'Vision', 'Long Context'],
    intelligenceIndex: 84.8
  },
  {
    id: 'gemini-1.5-pro',
    rank: 3,
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    status: 'operational' as const,
    availability: 99.6,
    responseTime: 301,
    errorRate: 0.08,
    throughput: 682,
    description: 'Advanced multimodal model with 1M token context',
    capabilities: ['Text Generation', 'Vision', 'Audio'],
    intelligenceIndex: 82.9
  }
]

export default function HomePage() {
  const { t } = useLanguage()
  const [models, setModels] = useState(fallbackModels)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simple timeout to simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI models...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">AI Model Dashboard</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time monitoring and analytics for AI model performance
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            All Systems Operational
          </div>
        </div>

        {/* Top Models */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Top 3 AI Models from Leading Providers
              </h2>
              <p className="text-gray-600">
                Source: Artificial Analysis • Updated: {new Date().toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <FeaturedModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
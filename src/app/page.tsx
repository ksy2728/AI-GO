'use client'

import { useEffect, useState } from 'react'

// Static models data - no external dependencies
const featuredModels = [
  {
    id: 'gpt-4o',
    rank: 1,
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerLogo: '/api/placeholder/40/40',
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
    providerLogo: '/api/placeholder/40/40',
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
    providerLogo: '/api/placeholder/40/40',
    status: 'operational' as const,
    availability: 99.6,
    responseTime: 301,
    errorRate: 0.08,
    throughput: 682,
    description: 'Advanced multimodal model with 1M token context',
    capabilities: ['Text Generation', 'Vision', 'Audio'],
    intelligenceIndex: 82.9
  },
  {
    id: 'gpt-5-high',
    rank: 4,
    name: 'GPT-5 (High)',
    provider: 'OpenAI',
    providerLogo: '/api/placeholder/40/40',
    status: 'operational' as const,
    availability: 99.95,
    responseTime: 200,
    errorRate: 0.02,
    throughput: 1100,
    description: 'Most advanced GPT-5 variant with maximum intelligence',
    capabilities: ['Text Generation', 'Vision', 'Advanced Reasoning', 'Code'],
    intelligenceIndex: 68.95
  },
  {
    id: 'claude-3-7-sonnet',
    rank: 5,
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    providerLogo: '/api/placeholder/40/40',
    status: 'operational' as const,
    availability: 99.7,
    responseTime: 200,
    errorRate: 0.04,
    throughput: 900,
    description: 'Latest hybrid reasoning model with advanced capabilities',
    capabilities: ['Text Generation', 'Hybrid Reasoning', 'Vision'],
    intelligenceIndex: 66.5
  },
  {
    id: 'gemini-2-0-flash',
    rank: 6,
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerLogo: '/api/placeholder/40/40',
    status: 'operational' as const,
    availability: 99.6,
    responseTime: 150,
    errorRate: 0.05,
    throughput: 1000,
    description: 'Fast and efficient model for real-time applications',
    capabilities: ['Text Generation', 'Vision', 'Fast Response'],
    intelligenceIndex: 63.4
  }
]

// Simple model card component without external dependencies
function SimpleModelCard({ model }: { model: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800'
      case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'outage': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-gray-600">#{model.rank}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{model.name}</h3>
            <p className="text-sm text-gray-500">{model.provider}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
          {model.status}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{model.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500">Availability</div>
          <div className="font-semibold text-green-600">{model.availability}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Response Time</div>
          <div className="font-semibold">{model.responseTime}ms</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Error Rate</div>
          <div className="font-semibold text-orange-600">{(model.errorRate).toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Intelligence</div>
          <div className="font-semibold text-purple-600">{model.intelligenceIndex}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {model.capabilities.slice(0, 3).map((cap: string) => (
          <span key={cap} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
            {cap}
          </span>
        ))}
        {model.capabilities.length > 3 && (
          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
            +{model.capabilities.length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [models, setModels] = useState(featuredModels)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI models...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Model Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time monitoring and analytics for AI model performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-blue-700 font-medium">API Mode</span>
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
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">
                Top 6 AI Models from Leading Providers
              </h2>
            </div>
            <div className="text-xs text-gray-500">
              Updated: {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
          
          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <SimpleModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-blue-600">99.8%</div>
            <div className="text-sm text-gray-600">Average Uptime</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-green-600">245ms</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-purple-600">{models.length}</div>
            <div className="text-sm text-gray-600">Active Models</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-orange-600">0.04%</div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
        </div>

      </div>
    </div>
  )
}
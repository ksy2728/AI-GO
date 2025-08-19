'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModelStatusPopup } from './ModelStatusPopup'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  Zap, 
  Clock, 
  Activity,
  ChevronRight,
  Sparkles
} from 'lucide-react'

interface FeaturedModelCardProps {
  model: {
    id: string
    name: string
    provider: string
    providerLogo?: string
    status: 'operational' | 'degraded' | 'outage'
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
    description?: string
    capabilities?: string[]
  }
}

export function FeaturedModelCard({ model }: FeaturedModelCardProps) {
  const { t } = useLanguage()
  const [showPopup, setShowPopup] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'outage':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      case 'degraded':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      case 'outage':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <>
      <Card
        className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-200"
        onClick={() => setShowPopup(true)}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50" />
        
        {/* Sparkle Effect for Featured Models */}
        <div className="absolute top-3 right-3">
          <Sparkles className="w-5 h-5 text-purple-400 opacity-60" />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {model.providerLogo ? (
                <img 
                  src={model.providerLogo} 
                  alt={model.provider}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {model.provider.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                <p className="text-sm text-gray-500">{model.provider}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(model.status)} flex items-center gap-1`}>
              {getStatusIcon(model.status)}
              <span className="capitalize">{model.status}</span>
            </Badge>
          </div>

          {/* Description */}
          {model.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {model.description}
            </p>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">{t('dashboard.stats.availability') || 'Availability'}</p>
                <p className="text-sm font-semibold text-gray-900">{model.availability.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">{t('dashboard.stats.responseTime') || 'Response'}</p>
                <p className="text-sm font-semibold text-gray-900">{formatResponseTime(model.responseTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-500">{t('dashboard.stats.errorRate') || 'Error Rate'}</p>
                <p className="text-sm font-semibold text-gray-900">{model.errorRate.toFixed(2)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">{t('dashboard.stats.throughput') || 'Throughput'}</p>
                <p className="text-sm font-semibold text-gray-900">{model.throughput} req/s</p>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          {model.capabilities && model.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {model.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {capability}
                </Badge>
              ))}
              {model.capabilities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{model.capabilities.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* View Details Button */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
              {t('dashboard.featuredModels.viewDetails') || 'View Details'}
            </span>
            <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>

      {/* Model Status Popup */}
      {showPopup && (
        <ModelStatusPopup
          model={model}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  )
}
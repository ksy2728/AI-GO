'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { X, Activity, Clock, Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface ModelStatusPopupProps {
  model: {
    id: string
    name: string
    provider: string
    status: 'operational' | 'degraded' | 'outage'
    availability: number
    responseTime: number
    errorRate: number
    throughput: number
    description?: string
    capabilities?: string[]
  }
  onClose: () => void
}

export function ModelStatusPopup({ model, onClose }: ModelStatusPopupProps) {
  const { t } = useLanguage()

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const getGradientPosition = (value: number, max: number = 100) => {
    return (value / max) * 100
  }

  const getAvailabilityColor = (value: number) => {
    if (value >= 99) return '#10b981' // green
    if (value >= 95) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const getResponseTimeColor = (value: number) => {
    if (value <= 100) return '#10b981' // green - fast
    if (value <= 500) return '#f59e0b' // yellow - moderate
    return '#ef4444' // red - slow
  }

  const getErrorRateColor = (value: number) => {
    if (value <= 0.1) return '#10b981' // green - low
    if (value <= 1) return '#f59e0b' // yellow - moderate
    return '#ef4444' // red - high
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card 
        className="relative w-full max-w-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{model.provider}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Current Status:</span>
            <Badge 
              className={`
                ${model.status === 'operational' ? 'bg-green-100 text-green-800' : ''}
                ${model.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${model.status === 'outage' ? 'bg-red-100 text-red-800' : ''}
                flex items-center gap-1
              `}
            >
              {model.status === 'operational' && <CheckCircle className="w-3 h-3" />}
              {model.status === 'degraded' && <AlertCircle className="w-3 h-3" />}
              {model.status === 'outage' && <X className="w-3 h-3" />}
              <span className="capitalize">{model.status}</span>
            </Badge>
          </div>

          {/* Availability Gradient Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {'Availability'}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">{model.availability.toFixed(1)}%</span>
            </div>
            <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ 
                  left: `${getGradientPosition(model.availability)}%`,
                  transition: 'left 0.5s ease-out'
                }}
              >
                <div className="absolute -top-1 -left-2 w-5 h-10 bg-white rounded-full shadow-lg border-2 border-gray-200" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Response Time Gradient Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {'Response Time'}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">{model.responseTime}ms</span>
            </div>
            <div className="relative h-8 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ 
                  left: `${Math.min(getGradientPosition(model.responseTime, 1000), 100)}%`,
                  transition: 'left 0.5s ease-out'
                }}
              >
                <div className="absolute -top-1 -left-2 w-5 h-10 bg-white rounded-full shadow-lg border-2 border-gray-200" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fast (0ms)</span>
              <span>500ms</span>
              <span>Slow (1000ms+)</span>
            </div>
          </div>

          {/* Error Rate Gradient Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {'Error Rate'}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">{model.errorRate.toFixed(2)}%</span>
            </div>
            <div className="relative h-8 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ 
                  left: `${Math.min(getGradientPosition(model.errorRate, 5), 100)}%`,
                  transition: 'left 0.5s ease-out'
                }}
              >
                <div className="absolute -top-1 -left-2 w-5 h-10 bg-white rounded-full shadow-lg border-2 border-gray-200" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low (0%)</span>
              <span>2.5%</span>
              <span>High (5%+)</span>
            </div>
          </div>

          {/* Throughput Bar Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">
                  {'Throughput'}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">{model.throughput} req/s</span>
            </div>
            <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                style={{ 
                  height: `${Math.min((model.throughput / 1000) * 100, 100)}%`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {model.throughput} / 1000 req/s
                </span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          {model.capabilities && model.capabilities.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                {t('model.capabilities') || 'Capabilities'}
              </span>
              <div className="flex flex-wrap gap-2">
                {model.capabilities.map((capability, index) => (
                  <Badge key={index} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
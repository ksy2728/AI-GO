'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  change?: number
  changeLabel?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  description,
  change,
  changeLabel,
  icon,
  trend,
  loading = false
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2" />
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      {icon && (
        <div className="absolute right-4 top-4 text-gray-200">
          {icon}
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {(change !== undefined || description) && (
          <div className="flex items-center gap-2 mt-2">
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="font-medium">{change}%</span>
                {changeLabel && <span className="text-gray-500">vs {changeLabel}</span>}
              </div>
            )}
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
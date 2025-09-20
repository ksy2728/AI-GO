'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle: string
  children: ReactNode
  icon?: ReactNode
  loading?: boolean
  error?: string
  className?: string
  dataSource?: string
  lastUpdated?: string
}

export function ChartCard({
  title,
  subtitle,
  children,
  icon,
  loading = false,
  error,
  className = '',
  dataSource,
  lastUpdated
}: ChartCardProps) {
  if (loading) {
    return (
      <Card className={`relative overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 backdrop-blur-xl ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20" />
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            {icon && <Skeleton className="h-8 w-8 rounded" />}
          </div>
        </CardHeader>
        <CardContent className="pt-4 relative z-10">
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                {title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {subtitle}
              </CardDescription>
            </div>
            {icon}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 flex items-center justify-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDataSource = (source?: string) => {
    if (!source) return null
    switch (source) {
      case 'database':
        return { label: 'Live DB', color: 'text-green-600 bg-green-50' }
      case 'aa-json-fallback':
      case 'aa-rankings':
        return { label: 'Cached', color: 'text-yellow-600 bg-yellow-50' }
      case 'fallback-empty':
      case 'error-fallback':
        return { label: 'Offline', color: 'text-gray-600 bg-gray-50' }
      default:
        return { label: source, color: 'text-blue-600 bg-blue-50' }
    }
  }

  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const sourceInfo = formatDataSource(dataSource)
  const timeAgo = formatLastUpdated(lastUpdated)

  return (
    <Card className={`relative overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </CardTitle>
              {sourceInfo && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceInfo.color}`}>
                  {sourceInfo.label}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm text-gray-600 mt-1">
                {subtitle}
              </CardDescription>
              {timeAgo && (
                <span className="text-xs text-gray-500 ml-2">
                  Updated {timeAgo}
                </span>
              )}
            </div>
          </div>
          <div className="p-2 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-xl shadow-sm backdrop-blur-sm ml-4">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 relative z-10">
        {children}
      </CardContent>
    </Card>
  )
}
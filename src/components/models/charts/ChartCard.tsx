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
}

export function ChartCard({ 
  title, 
  subtitle, 
  children, 
  icon, 
  loading = false, 
  error,
  className = ''
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

  return (
    <Card className={`relative overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {subtitle}
            </CardDescription>
          </div>
          <div className="p-2 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-xl shadow-sm backdrop-blur-sm">
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
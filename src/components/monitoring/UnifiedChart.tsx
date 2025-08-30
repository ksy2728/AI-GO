'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ComposedChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { useRealtime } from '@/hooks/useRealtime'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGlobalStats } from '@/contexts/ModelsContext'

export function UnifiedChart() {
  const { t } = useLanguage()
  const { connected, globalStats } = useRealtime()
  const { globalStats: contextStats, totalModels, activeModels } = useGlobalStats()
  const [chartData, setChartData] = useState<any[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use context stats first (more reliable), fallback to realtime stats
  const effectiveStats = contextStats || globalStats
  
  // Calculate dynamic total models from available sources
  const dynamicTotalModels = effectiveStats?.totalModels || totalModels || 0

  // Fetch realtime stats from Edge Function
  const fetchRealtimeStats = async () => {
    try {
      const response = await fetch('/api/v1/realtime-stats')
      if (response.ok) {
        const data = await response.json()
        
        // Use historical data if available
        if (data.history && data.history.length > 0) {
          const formattedData = data.history.map((point: any) => ({
            time: point.time,
            activeModels: point.activeModels || 0,
            avgAvailability: point.avgAvailability || 0,
            operationalModels: point.operationalModels || 0,
            degradedModels: point.degradedModels || 0,
            outageModels: point.outageModels || 0,
            timestamp: point.timestamp
          }))
          setChartData(formattedData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch realtime stats:', error)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchRealtimeStats()
  }, [])

  // Start polling for production environment
  useEffect(() => {
    if (!connected && !isPolling) {
      setIsPolling(true)
      pollingIntervalRef.current = setInterval(fetchRealtimeStats, 30000) // Poll every 30 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [connected, isPolling])

  // Update chart when WebSocket data arrives or context stats change
  useEffect(() => {
    const statsToUse = globalStats && connected ? globalStats : contextStats
    if (statsToUse) {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      const newPoint = {
        time: timeString,
        activeModels: statsToUse.activeModels || 0,
        avgAvailability: statsToUse.avgAvailability || 0,
        operationalModels: statsToUse.operationalModels || 0,
        degradedModels: statsToUse.degradedModels || 0,
        outageModels: statsToUse.outageModels || 0,
        timestamp: now.getTime()
      }

      setChartData(prev => {
        const updated = [...prev, newPoint]
        // Keep only last 20 points
        if (updated.length > 20) {
          return updated.slice(-20)
        }
        return updated
      })
    }
  }, [globalStats, connected, contextStats])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.name.includes('Availability') ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('monitoring.unifiedChart.title')}
            </CardTitle>
            <CardDescription className="text-xs text-gray-600 mt-0.5">
              {t('monitoring.unifiedChart.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              opacity={0.3}
              vertical={false}
            />
            
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              fontSize={11}
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            
            <YAxis 
              yAxisId="left"
              stroke="#9ca3af"
              fontSize={11}
              tick={{ fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              domain={[0, 150]}
              ticks={[0, 30, 60, 90, 120, 150]}
              label={{ 
                value: 'Models Count (Global)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: '#6b7280', fontSize: 13, fontWeight: 500 } 
              }}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              fontSize={11}
              tick={{ fill: '#6b7280' }}
              domain={[85, 100]}
              ticks={[85, 90, 95, 100]}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ 
                value: 'Availability %', 
                angle: 90, 
                position: 'insideRight', 
                style: { fill: '#6b7280', fontSize: 13, fontWeight: 500 } 
              }}
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: '#4b5563', fontSize: 12 }}>{value}</span>}
            />
            
            {/* Active Models - Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="activeModels"
              name={`Active Models (${chartData.length > 0 ? chartData[chartData.length - 1].activeModels || 0 : activeModels || 0}/${dynamicTotalModels})`}
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: '#3b82f6', r: 2 }}
              activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
              animationDuration={1000}
            />
            
            {/* Operational Models - Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="operationalModels"
              name={`Operational (${chartData.length > 0 ? chartData[chartData.length - 1].operationalModels || 0 : effectiveStats?.operationalModels || 0}/${dynamicTotalModels})`}
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ fill: '#6366f1', r: 2 }}
              activeDot={{ r: 4, stroke: '#6366f1', strokeWidth: 2 }}
              animationDuration={1200}
            />
            
            {/* Degraded Models - Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="degradedModels"
              name={t('dashboard.legend.degraded') || 'Degraded'}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#f59e0b', r: 2 }}
              activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2 }}
              animationDuration={1400}
            />
            
            {/* Outage Models - Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="outageModels"
              name={t('dashboard.legend.outage') || 'Outage'}
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 2 }}
              activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2 }}
              animationDuration={1600}
            />
            
            {/* Availability - Smooth Line with Gradient */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgAvailability"
              name={'Avg Availability'}
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 3, strokeWidth: 1, stroke: '#fff' }}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
              animationDuration={1800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
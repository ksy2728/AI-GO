'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useRealtime } from '@/hooks/useRealtime'

interface RealtimeChartProps {
  title: string
  description?: string
  type?: 'line' | 'area' | 'bar'
  dataKey: string
  color?: string
  height?: number
}

export function RealtimeChart({
  title,
  description,
  type = 'line',
  dataKey,
  color = '#3b82f6',
  height = 300
}: RealtimeChartProps) {
  const { connected, globalStats } = useRealtime()
  const [chartData, setChartData] = useState<any[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
            value: point[dataKey] || 0,
            timestamp: point.timestamp
          }))
          setChartData(formattedData)
        } else {
          // Add single data point
          const newDataPoint = {
            time: new Date().toLocaleTimeString('ko-KR', {
              timeZone: 'Asia/Seoul',
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            value: data[dataKey] || 0,
            timestamp: Date.now()
          }
          
          setChartData(prev => {
            const updated = [...prev, newDataPoint].slice(-20)
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch realtime stats:', error)
    }
  }

  useEffect(() => {
    // If WebSocket is connected, use it
    if (globalStats) {
      const newDataPoint = {
        time: new Date().toLocaleTimeString('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        value: globalStats[dataKey as keyof typeof globalStats] || 0,
        timestamp: Date.now()
      }

      setChartData(prev => {
        // Keep only last 20 data points
        const updated = [...prev, newDataPoint].slice(-20)
        return updated
      })
    } else if (!connected) {
      // For production without WebSocket, use Edge Function polling
      setIsPolling(true)
      
      // Initial fetch
      fetchRealtimeStats()
      
      // Set up polling interval (every 10 seconds)
      pollingIntervalRef.current = setInterval(() => {
        fetchRealtimeStats()
      }, 10000)
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [globalStats, dataKey, connected])

  const renderChart = () => {
    const props = {
      data: chartData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    }

    switch (type) {
      case 'area':
        return (
          <AreaChart {...props}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              labelStyle={{ color: '#666' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`} 
              animationDuration={300}
            />
          </AreaChart>
        )
      case 'bar':
        return (
          <BarChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              labelStyle={{ color: '#666' }}
            />
            <Bar dataKey="value" fill={color} animationDuration={300} />
          </BarChart>
        )
      default:
        return (
          <LineChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}
              labelStyle={{ color: '#666' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {connected ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Live</span>
            </div>
          ) : isPolling ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Polling</span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            <p>Waiting for data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
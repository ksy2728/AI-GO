'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap } from 'lucide-react'
import { ChartCard } from './ChartCard'
import { ModelHighlight } from '@/lib/model-metrics'

interface SpeedChartProps {
  data: ModelHighlight[]
  loading?: boolean
  error?: string
}

export function SpeedChart({ data, loading, error }: SpeedChartProps) {
  const chartData = data.map(item => ({
    name: item.modelName.length > 15 
      ? item.modelName.substring(0, 12) + '...' 
      : item.modelName,
    fullName: item.modelName,
    value: item.value,
    provider: item.provider,
    color: item.color
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-xl p-4 border border-green-200/50 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 animate-pulse" />
            <p className="font-bold text-gray-900">{data.fullName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-gradient-to-r from-green-100 to-green-50 rounded-md">
              <p className="text-xs font-medium text-gray-700">{data.provider}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-100">
            <p className="text-sm font-semibold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Processing Speed
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(data.value)}
              </p>
              <p className="text-sm text-green-600/70">tokens/s</p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height } = props
    return (
      <g className="bar-group">
        <defs>
          <linearGradient id={`speed-gradient-${props.index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
            <stop offset="50%" stopColor="#10B981" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
          </linearGradient>
          <filter id={`speed-shadow-${props.index}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>
        
        {/* Background glow effect */}
        <rect
          x={x - 2}
          y={y}
          width={width + 4}
          height={height}
          fill="url(#speed-gradient-${props.index})"
          opacity={0.2}
          rx={6}
          className="animate-pulse"
        />
        
        {/* Main bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#speed-gradient-${props.index})`}
          filter={`url(#speed-shadow-${props.index})`}
          rx={6}
          className="bar-main transition-all duration-300 hover:filter hover:brightness-110"
          style={{
            animation: `slideUp 0.5s ease-out ${props.index * 0.1}s backwards`,
          }}
        />
        
        {/* Top highlight */}
        <rect
          x={x + 2}
          y={y + 2}
          width={width - 4}
          height={4}
          fill="white"
          opacity={0.3}
          rx={2}
        />
        
        {/* Speed indicator animation */}
        <rect
          x={x}
          y={y}
          width={width}
          height={2}
          fill="white"
          opacity={0.5}
          rx={1}
          style={{
            animation: `speedPulse 2s ease-in-out ${props.index * 0.2}s infinite`,
          }}
        />
        
        {/* Value label inside bar - vertical text */}
        <g>
          <text
            x={x + width / 2}
            y={y + height / 2}
            fill="white"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
          >
            {Math.round(props.value)}
          </text>
        </g>
        
      </g>
    )
  }

  return (
    <ChartCard
      title="SPEED"
      subtitle="Output Tokens per Second: Higher is better"
      icon={<Zap className="w-6 h-6 text-green-600" />}
      loading={loading}
      error={error}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 20, bottom: 60, left: 40 }}
        >
          <defs>
            <pattern id="grid-pattern-speed" patternUnits="userSpaceOnUse" width="40" height="40">
              <circle cx="1" cy="1" r="1" fill="#e5e7eb" opacity="0.5" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="url(#grid-pattern-speed)" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ 
              value: 'Tokens/Second', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6b7280' }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
          <Bar dataKey="value" shape={<CustomBar />} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {[...new Set(data.map(d => d.provider))].map(provider => (
          <div key={provider} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.find(d => d.provider === provider)?.color }}
            />
            <span className="text-xs text-gray-600">{provider}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Brain } from 'lucide-react'
import { ChartCard } from './ChartCard'
import { ModelHighlight } from '@/lib/model-metrics'

interface IntelligenceChartProps {
  data: ModelHighlight[]
  loading?: boolean
  error?: string
}

export function IntelligenceChart({ data, loading, error }: IntelligenceChartProps) {
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
        <div className="bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-xl p-4 border border-blue-200/50 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
            <p className="font-bold text-gray-900">{data.fullName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-50 rounded-md">
              <p className="text-xs font-medium text-gray-700">{data.provider}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-100">
            <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Intelligence Score
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {data.value.toFixed(1)}
            </p>
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
          <linearGradient id={`intel-gradient-${props.index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.9} />
          </linearGradient>
          <filter id={`intel-shadow-${props.index}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>
        
        {/* Background glow effect */}
        <rect
          x={x - 2}
          y={y}
          width={width + 4}
          height={height}
          fill="url(#intel-gradient-${props.index})"
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
          fill={`url(#intel-gradient-${props.index})`}
          filter={`url(#intel-shadow-${props.index})`}
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
        
        {/* Value label with background */}
        <g>
          <rect
            x={x + width / 2 - 20}
            y={y - 22}
            width={40}
            height={18}
            fill="white"
            stroke="#3B82F6"
            strokeWidth={1}
            rx={9}
            opacity={0.95}
          />
          <text
            x={x + width / 2}
            y={y - 8}
            fill="#1E40AF"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
          >
            {props.value.toFixed(1)}
          </text>
        </g>
        
      </g>
    )
  }

  return (
    <ChartCard
      title="INTELLIGENCE"
      subtitle="Artificial Analysis Intelligence Index: Higher is better"
      icon={<Brain className="w-6 h-6 text-blue-600" />}
      loading={loading}
      error={error}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 20, bottom: 60, left: 20 }}
        >
          <defs>
            <pattern id="grid-pattern" patternUnits="userSpaceOnUse" width="40" height="40">
              <circle cx="1" cy="1" r="1" fill="#e5e7eb" opacity="0.5" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="url(#grid-pattern)" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ 
              value: 'Intelligence Score', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6b7280' }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
          <Bar dataKey="value" shape={<CustomBar />} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        {[...new Set(data.map(d => d.provider))].map(provider => (
          <div key={provider} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-white rounded-full shadow-sm hover:shadow-md transition-all duration-200">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ 
                backgroundColor: data.find(d => d.provider === provider)?.color,
                boxShadow: `0 0 8px ${data.find(d => d.provider === provider)?.color}40`
              }}
            />
            <span className="text-xs font-medium text-gray-700">{provider}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
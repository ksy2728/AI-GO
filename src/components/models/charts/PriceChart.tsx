'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign } from 'lucide-react'
import { ChartCard } from './ChartCard'
import { ModelHighlight } from '@/lib/model-metrics'

interface PriceChartProps {
  data: ModelHighlight[]
  loading?: boolean
  error?: string
}

export function PriceChart({ data, loading, error }: PriceChartProps) {
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
        <div className="bg-gradient-to-br from-white/95 to-orange-50/95 backdrop-blur-xl p-4 border border-orange-200/50 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse" />
            <p className="font-bold text-gray-900">{data.fullName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-gradient-to-r from-orange-100 to-orange-50 rounded-md">
              <p className="text-xs font-medium text-gray-700">{data.provider}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-orange-100">
            <p className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Cost Efficiency
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-orange-600">
                ${data.value.toFixed(2)}
              </p>
              <p className="text-sm text-orange-600/70">per 1M tokens</p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height } = props
    const isLowestPrice = props.index === 0 // First bar is cheapest
    
    return (
      <g className="bar-group">
        <defs>
          <linearGradient id={`price-gradient-${props.index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLowestPrice ? "#10B981" : "#FCD34D"} stopOpacity={1} />
            <stop offset="50%" stopColor={isLowestPrice ? "#059669" : "#F59E0B"} stopOpacity={0.95} />
            <stop offset="100%" stopColor={isLowestPrice ? "#047857" : "#DC2626"} stopOpacity={0.9} />
          </linearGradient>
          <filter id={`price-shadow-${props.index}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>
        
        {/* Background glow effect */}
        <rect
          x={x - 2}
          y={y}
          width={width + 4}
          height={height}
          fill={`url(#price-gradient-${props.index})`}
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
          fill={`url(#price-gradient-${props.index})`}
          filter={`url(#price-shadow-${props.index})`}
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
        
        {/* Best value indicator */}
        {isLowestPrice && (
          <g>
            <rect
              x={x + width / 2 - 30}
              y={y + height / 2 - 10}
              width={60}
              height={20}
              fill="white"
              opacity={0.9}
              rx={10}
            />
            <text
              x={x + width / 2}
              y={y + height / 2 + 4}
              fill="#059669"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
            >
              BEST VALUE
            </text>
          </g>
        )}
        
        {/* Value label with background */}
        <g>
          <rect
            x={x + width / 2 - 30}
            y={y - 22}
            width={60}
            height={18}
            fill="white"
            stroke={isLowestPrice ? "#10B981" : "#F59E0B"}
            strokeWidth={1}
            rx={9}
            opacity={0.95}
          />
          <text
            x={x + width / 2}
            y={y - 8}
            fill={isLowestPrice ? "#047857" : "#DC2626"}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
          >
            ${props.value.toFixed(2)}
          </text>
        </g>
        
      </g>
    )
  }

  return (
    <ChartCard
      title="PRICE"
      subtitle="USD per 1M Tokens: Lower is better"
      icon={<DollarSign className="w-6 h-6 text-orange-600" />}
      loading={loading}
      error={error}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart 
          data={chartData} 
          margin={{ top: 30, right: 20, bottom: 60, left: 40 }}
        >
          <defs>
            <pattern id="grid-pattern-price" patternUnits="userSpaceOnUse" width="40" height="40">
              <circle cx="1" cy="1" r="1" fill="#e5e7eb" opacity="0.5" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="url(#grid-pattern-price)" opacity={0.1} />
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
              value: 'USD per 1M Tokens', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6b7280' }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }} />
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
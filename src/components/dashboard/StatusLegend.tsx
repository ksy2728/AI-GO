'use client'

import { Badge } from '@/components/ui/badge'

interface LegendItem {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

const legendItems: LegendItem[] = [
  {
    label: 'Operational',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  {
    label: 'Degraded',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  {
    label: 'Outage',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  }
]

export function StatusLegend() {
  return (
    <div className="flex items-center gap-2 mb-2">
      {legendItems.map((item) => (
        <div
          key={item.label}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${item.bgColor} ${item.borderColor}`}
        >
          <div className={`w-2 h-2 rounded-full ${item.bgColor.replace('100', '500')}`} />
          <span className={`text-xs font-medium ${item.color}`}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
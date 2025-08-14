import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  
  if (absNum >= 1e9) {
    const val = absNum / 1e9
    return sign + (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'B'
  }
  if (absNum >= 1e6) {
    const val = absNum / 1e6
    return sign + (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'M'
  }
  if (absNum >= 1e3) {
    const val = absNum / 1e3
    return sign + (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'K'
  }
  return num.toString()
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount)
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return target.toLocaleDateString()
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid Date'
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'operational':
      return 'bg-green-500'
    case 'degraded':
      return 'bg-yellow-500'
    case 'outage':
      return 'bg-red-500'
    case 'maintenance':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0 && newValue === 0) return 0
  if (oldValue === 0) return Infinity
  
  const change = ((newValue - oldValue) / oldValue) * 100
  return Math.round(change * 100) / 100
}

export function calculateAvailability(uptime: number, total: number): number {
  if (total === 0) return 100
  return Math.round((uptime / total) * 100 * 100) / 100
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
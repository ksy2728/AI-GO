'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableCardProps {
  title: string
  subtitle?: string
  badge?: string | number
  children: React.ReactNode
  defaultExpanded?: boolean
  onExpansionChange?: (expanded: boolean) => void
  priority?: 'high' | 'medium' | 'low'
  className?: string
  headerContent?: React.ReactNode
  disabled?: boolean
}

export function ExpandableCard({
  title,
  subtitle,
  badge,
  children,
  defaultExpanded = false,
  onExpansionChange,
  priority = 'medium',
  className,
  headerContent,
  disabled = false
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight
      setContentHeight(height)
    }
  }, [children, isExpanded])

  // Handle expansion toggle
  const handleToggle = () => {
    if (disabled) return

    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onExpansionChange?.(newExpanded)
  }

  // Priority-based styling
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          border: 'border-blue-200',
          header: 'bg-blue-50',
          badge: 'bg-blue-600'
        }
      case 'low':
        return {
          border: 'border-gray-200',
          header: 'bg-gray-50',
          badge: 'bg-gray-600'
        }
      default:
        return {
          border: 'border-gray-200',
          header: 'bg-white',
          badge: 'bg-blue-600'
        }
    }
  }

  const styles = getPriorityStyles()

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md touch-manipulation',
        styles.border,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <CardHeader
        className={cn(
          'cursor-pointer select-none transition-colors duration-200',
          styles.header,
          disabled ? 'cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {title}
                </h3>
                {badge && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs text-white',
                      styles.badge
                    )}
                  >
                    {badge}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            {headerContent && (
              <div className="flex-shrink-0">
                {headerContent}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700 touch-manipulation flex-shrink-0"
            disabled={disabled}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: isExpanded ? `${contentHeight}px` : '0px'
        }}
      >
        <CardContent
          ref={contentRef}
          className="pt-0 pb-4"
        >
          <div className="border-t border-gray-100 pt-4">
            {children}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

// Specialized version for model cards
interface ExpandableModelCardProps extends Omit<ExpandableCardProps, 'title' | 'subtitle'> {
  model: {
    name: string
    provider: string
    status?: string
    intelligence?: number
    speed?: number
    description?: string
  }
}

export function ExpandableModelCard({
  model,
  children,
  ...props
}: ExpandableModelCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'down':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <ExpandableCard
      title={model.name}
      subtitle={model.description || `Provider: ${model.provider}`}
      priority={model.intelligence && model.intelligence > 80 ? 'high' : 'medium'}
      headerContent={
        <div className="flex items-center gap-2">
          {model.intelligence && (
            <div className="flex items-center gap-1">
              <div className="w-8 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${model.intelligence}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 min-w-[24px]">
                {model.intelligence}
              </span>
            </div>
          )}
          {model.status && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs border-0 font-medium',
                getStatusColor(model.status)
              )}
            >
              {model.status}
            </Badge>
          )}
        </div>
      }
      {...props}
    >
      {children}
    </ExpandableCard>
  )
}
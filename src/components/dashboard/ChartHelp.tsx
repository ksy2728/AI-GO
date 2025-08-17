'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChartHelpProps {
  title: string
  content: string[]
}

export function ChartHelp({ title, content }: ChartHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-80 p-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg -left-36 top-6">
          <div className="relative">
            {/* Arrow pointer */}
            <div className="absolute -top-6 left-36 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45" />
            
            <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
            <div className="space-y-1">
              {content.map((text, index) => (
                <p key={index} className="text-sm text-gray-600">
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
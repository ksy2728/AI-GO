import React from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  error: string
  onRetry: () => void
  retryCount?: number
  maxRetries?: number
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3
}) => {
  // Determine error type and icon
  const isNetworkError = error.toLowerCase().includes('network') || 
                        error.toLowerCase().includes('connection')
  const isTimeoutError = error.toLowerCase().includes('timeout')
  const isServerError = error.toLowerCase().includes('server')
  
  const getErrorIcon = () => {
    if (isNetworkError) return <WifiOff className="w-12 h-12 text-red-500" />
    if (isTimeoutError) return <AlertTriangle className="w-12 h-12 text-orange-500" />
    if (isServerError) return <Server className="w-12 h-12 text-red-500" />
    return <AlertTriangle className="w-12 h-12 text-red-500" />
  }
  
  const getErrorTitle = () => {
    if (isNetworkError) return 'Connection Problem'
    if (isTimeoutError) return 'Request Timeout'
    if (isServerError) return 'Server Error'
    return 'Something Went Wrong'
  }
  
  const getErrorDescription = () => {
    if (isNetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }
    if (isTimeoutError) {
      return 'The server is taking too long to respond. Please try again in a moment.'
    }
    if (isServerError) {
      return 'The server encountered an error. Our team has been notified and is working on a fix.'
    }
    return error || 'An unexpected error occurred. Please try again.'
  }
  
  const getSuggestions = () => {
    const suggestions = []
    
    if (isNetworkError) {
      suggestions.push('Check your internet connection')
      suggestions.push('Disable VPN or proxy if using one')
      suggestions.push('Try refreshing the page')
    } else if (isTimeoutError) {
      suggestions.push('Wait a few moments and try again')
      suggestions.push('Check if the server is under maintenance')
    } else if (isServerError) {
      suggestions.push('Try again in a few minutes')
      suggestions.push('Contact support if the problem persists')
    }
    
    return suggestions
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          {getErrorIcon()}
        </div>
        
        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900">
          {getErrorTitle()}
        </h2>
        
        {/* Error Description */}
        <p className="text-gray-600">
          {getErrorDescription()}
        </p>
        
        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="text-sm text-gray-500">
            Retry attempt {retryCount} of {maxRetries} failed
          </div>
        )}
        
        {/* Suggestions */}
        {getSuggestions().length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              What you can try:
            </h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
        </div>
        
        {/* Network Status Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm">
          {typeof window !== 'undefined' && navigator.onLine ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">You are online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">You are offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
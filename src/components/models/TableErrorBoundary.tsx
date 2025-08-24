'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Grid, LayoutGrid } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: () => void
  onSwitchToCards?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class TableErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Table Error Boundary caught an error:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack
    })
    
    // 에러 발생 시 부모에게 알림
    this.props.onError?.()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleSwitchToCards = () => {
    this.props.onSwitchToCards?.()
    this.handleReset()
  }

  public render() {
    if (this.state.hasError) {
      // 사용자 정의 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Table View Error
            </h3>
            <p className="text-gray-600 mb-6">
              There was an error rendering the table view. This might be due to data formatting issues or browser compatibility.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-md text-left">
                <p className="text-sm font-mono text-red-800 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.props.onSwitchToCards && (
                <Button 
                  onClick={this.handleSwitchToCards}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Switch to Card View
                </Button>
              )}
              <Button 
                onClick={this.handleReset}
                variant="outline"
              >
                <Grid className="h-4 w-4 mr-2" />
                Try Table Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
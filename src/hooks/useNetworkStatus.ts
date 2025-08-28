import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkStatus = () => {
      const status: NetworkStatus = {
        isOnline: navigator.onLine
      }

      // Get additional network information if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      if (connection) {
        status.connectionType = connection.type
        status.effectiveType = connection.effectiveType
        status.downlink = connection.downlink
        status.rtt = connection.rtt
        status.saveData = connection.saveData
      }

      setNetworkStatus(status)
    }

    // Initial status
    updateNetworkStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Listen for connection changes if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return networkStatus
}

// Hook for monitoring API health
export function useAPIHealth(checkInterval = 30000) { // Check every 30 seconds
  const [apiHealth, setApiHealth] = useState({
    isHealthy: true,
    lastCheck: new Date(),
    responseTime: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkAPIHealth = async () => {
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/v1/status', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        const responseTime = Date.now() - startTime
        
        setApiHealth({
          isHealthy: response.ok,
          lastCheck: new Date(),
          responseTime
        })
      } catch (error) {
        setApiHealth({
          isHealthy: false,
          lastCheck: new Date(),
          responseTime: Date.now() - startTime
        })
      }
    }

    // Initial check
    checkAPIHealth()

    // Set up interval
    const interval = setInterval(checkAPIHealth, checkInterval)

    return () => clearInterval(interval)
  }, [checkInterval])

  return apiHealth
}
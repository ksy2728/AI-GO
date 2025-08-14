import { useEffect, useState, useCallback, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

export interface RealtimeUpdate {
  type: 'model:status' | 'model:availability' | 'incident:new' | 'sync:completed' | 'global:stats'
  data: any
  timestamp: string
}

export interface GlobalStats {
  totalModels: number
  activeModels: number
  avgAvailability: number
  operationalModels: number
  degradedModels: number
  outageModels: number
  totalProviders: number
  lastSync: string
}

export interface UseRealtimeOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 5000,
  } = options

  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [modelStatuses, setModelStatuses] = useState<Map<string, any>>(new Map())
  const [recentUpdates, setRecentUpdates] = useState<RealtimeUpdate[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return

    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3006')

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    })

    socketInstance.on('connect', () => {
      console.log('📡 Connected to realtime server')
      setConnected(true)
      setError(null)
      reconnectAttemptsRef.current = 0
      
      // Subscribe to global stats by default
      socketInstance.emit('subscribe:global')
    })

    socketInstance.on('disconnect', () => {
      console.log('📡 Disconnected from realtime server')
      setConnected(false)
    })

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message)
      setError(err.message)
      
      // Manual reconnection with exponential backoff
      if (reconnection && reconnectAttemptsRef.current < reconnectionAttempts) {
        const delay = reconnectionDelay * Math.pow(2, reconnectAttemptsRef.current)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          socketInstance.connect()
        }, delay)
      }
    })

    // Handle realtime updates
    socketInstance.on('realtime:update', (update: RealtimeUpdate) => {
      console.log('📨 Received update:', update.type)
      
      // Add to recent updates
      setRecentUpdates(prev => [update, ...prev].slice(0, 50))
      
      // Handle specific update types
      switch (update.type) {
        case 'global:stats':
          setGlobalStats(update.data)
          break
          
        case 'model:status':
          setModelStatuses(prev => {
            const newMap = new Map(prev)
            newMap.set(update.data.modelId, update.data)
            return newMap
          })
          break
          
        case 'incident:new':
          // Could trigger a notification here
          console.warn('⚠️ New incident:', update.data)
          break
          
        case 'sync:completed':
          console.log('✅ Sync completed:', update.data)
          break
      }
    })

    // Handle heartbeat
    socketInstance.on('pong', (data) => {
      console.log('💓 Heartbeat received:', data.timestamp)
    })

    setSocket(socketInstance)

    // Send periodic heartbeat
    const heartbeatInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping')
      }
    }, 30000)

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      clearInterval(heartbeatInterval)
      socketInstance.disconnect()
    }
  }, [autoConnect, reconnection, reconnectionAttempts, reconnectionDelay])

  // Subscribe to specific models
  const subscribeToModels = useCallback((modelIds: string[]) => {
    if (socket?.connected) {
      socket.emit('subscribe:models', modelIds)
      console.log('📡 Subscribed to models:', modelIds)
    }
  }, [socket])

  // Unsubscribe from models
  const unsubscribeFromModels = useCallback((modelIds: string[]) => {
    if (socket?.connected) {
      socket.emit('unsubscribe:models', modelIds)
      console.log('📡 Unsubscribed from models:', modelIds)
    }
  }, [socket])

  // Subscribe to providers
  const subscribeToProviders = useCallback((providerIds: string[]) => {
    if (socket?.connected) {
      socket.emit('subscribe:providers', providerIds)
      console.log('📡 Subscribed to providers:', providerIds)
    }
  }, [socket])

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect()
    }
  }, [socket])

  const disconnect = useCallback(() => {
    if (socket?.connected) {
      socket.disconnect()
    }
  }, [socket])

  // Clear recent updates
  const clearUpdates = useCallback(() => {
    setRecentUpdates([])
  }, [])

  return {
    // Connection state
    connected,
    error,
    socket,
    
    // Data
    globalStats,
    modelStatuses: Array.from(modelStatuses.values()),
    recentUpdates,
    
    // Actions
    subscribeToModels,
    unsubscribeFromModels,
    subscribeToProviders,
    connect,
    disconnect,
    clearUpdates,
  }
}

// Hook for global stats only
export function useGlobalStats() {
  const { globalStats, connected, error } = useRealtime()
  return { stats: globalStats, connected, error }
}

// Hook for specific model status
export function useModelStatus(modelId: string) {
  const { modelStatuses, subscribeToModels, unsubscribeFromModels, connected } = useRealtime()
  
  useEffect(() => {
    if (connected && modelId) {
      subscribeToModels([modelId])
      return () => {
        unsubscribeFromModels([modelId])
      }
    }
  }, [connected, modelId, subscribeToModels, unsubscribeFromModels])
  
  const status = modelStatuses.find(s => s.modelId === modelId)
  return { status, connected }
}

// Hook for multiple model statuses
export function useModelStatuses(modelIds: string[]) {
  const { modelStatuses, subscribeToModels, unsubscribeFromModels, connected } = useRealtime()
  
  useEffect(() => {
    if (connected && modelIds.length > 0) {
      subscribeToModels(modelIds)
      return () => {
        unsubscribeFromModels(modelIds)
      }
    }
  }, [connected, modelIds, subscribeToModels, unsubscribeFromModels])
  
  const statuses = modelStatuses.filter(s => modelIds.includes(s.modelId))
  return { statuses, connected }
}
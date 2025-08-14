const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class RealtimeService {
  constructor() {
    this.io = null
    this.updateInterval = null
    this.connectedClients = new Map()
  }

  initialize(io) {
    this.io = io
    this.setupEventHandlers()
    this.startMonitoring()
    console.log('✅ Realtime monitoring service initialized')
  }

  setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      this.handleClientConnection(socket)
    })
  }

  handleClientConnection(socket) {
    console.log(`📡 Client connected: ${socket.id}`)
    
    // Track client connection
    this.connectedClients.set(socket.id, {
      socketId: socket.id,
      subscriptions: new Set()
    })

    // Send initial global stats
    this.sendGlobalStats(socket.id)

    // Handle model subscriptions
    socket.on('subscribe:models', async (modelIds) => {
      const client = this.connectedClients.get(socket.id)
      if (client) {
        modelIds.forEach(id => {
          socket.join(`model:${id}`)
          client.subscriptions.add(`model:${id}`)
        })
        
        // Send current status for subscribed models
        await this.sendModelStatuses(socket.id, modelIds)
      }
    })

    socket.on('unsubscribe:models', (modelIds) => {
      const client = this.connectedClients.get(socket.id)
      if (client) {
        modelIds.forEach(id => {
          socket.leave(`model:${id}`)
          client.subscriptions.delete(`model:${id}`)
        })
      }
    })

    // Handle global status subscription
    socket.on('subscribe:global', () => {
      socket.join('status:global')
      const client = this.connectedClients.get(socket.id)
      if (client) {
        client.subscriptions.add('status:global')
      }
    })

    socket.on('unsubscribe:global', () => {
      socket.leave('status:global')
      const client = this.connectedClients.get(socket.id)
      if (client) {
        client.subscriptions.delete('status:global')
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`📡 Client disconnected: ${socket.id}`)
      this.connectedClients.delete(socket.id)
    })

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })
  }

  async sendGlobalStats(socketId) {
    try {
      const [
        totalModels,
        activeModels,
        providers,
        statuses
      ] = await Promise.all([
        prisma.model.count(),
        prisma.model.count({ where: { isActive: true } }),
        prisma.provider.count(),
        prisma.modelStatus.findMany({
          where: { region: 'us-east' },
          select: { availability: true, status: true }
        })
      ])

      const avgAvailability = statuses.length > 0
        ? statuses.reduce((acc, s) => acc + s.availability, 0) / statuses.length
        : 0

      const operationalModels = statuses.filter(s => s.status === 'operational').length
      const degradedModels = statuses.filter(s => s.status === 'degraded').length
      const outageModels = statuses.filter(s => s.status === 'outage').length

      const stats = {
        totalModels,
        activeModels,
        avgAvailability,
        operationalModels,
        degradedModels,
        outageModels,
        totalProviders: providers,
        lastSync: new Date().toISOString()
      }

      const update = {
        type: 'global:stats',
        data: stats,
        timestamp: new Date().toISOString()
      }

      if (socketId && this.io) {
        this.io.to(socketId).emit('realtime:update', update)
      } else if (this.io) {
        this.io.to('status:global').emit('realtime:update', update)
      }
    } catch (error) {
      console.error('❌ Error sending global stats:', error)
    }
  }

  async sendModelStatuses(socketId, modelIds) {
    try {
      const statuses = await prisma.modelStatus.findMany({
        where: {
          modelId: { in: modelIds },
          region: 'us-east'
        },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      statuses.forEach(status => {
        const update = {
          type: 'model:status',
          data: {
            modelId: status.modelId,
            modelName: status.model.name,
            status: status.status,
            availability: status.availability,
            latencyP50: status.latencyP50,
            latencyP95: status.latencyP95,
            latencyP99: status.latencyP99,
            errorRate: status.errorRate,
            requestsPerMin: status.requestsPerMin
          },
          timestamp: new Date().toISOString()
        }

        if (this.io) {
          this.io.to(socketId).emit('realtime:update', update)
        }
      })
    } catch (error) {
      console.error('❌ Error sending model statuses:', error)
    }
  }

  startMonitoring() {
    // Send global stats every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.sendGlobalStats()
      await this.checkModelChanges()
    }, 30000)

    // Initial check
    this.sendGlobalStats()
  }

  async checkModelChanges() {
    try {
      // Get recent status updates (last minute)
      const recentUpdates = await prisma.modelStatus.findMany({
        where: {
          checkedAt: {
            gte: new Date(Date.now() - 60000)
          }
        },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      // Broadcast updates to subscribed clients
      recentUpdates.forEach(status => {
        const update = {
          type: 'model:status',
          data: {
            modelId: status.modelId,
            modelName: status.model.name,
            status: status.status,
            availability: status.availability,
            latencyP50: status.latencyP50,
            latencyP95: status.latencyP95,
            latencyP99: status.latencyP99,
            errorRate: status.errorRate,
            requestsPerMin: status.requestsPerMin
          },
          timestamp: new Date().toISOString()
        }

        if (this.io) {
          this.io.to(`model:${status.modelId}`).emit('realtime:update', update)
        }
      })
    } catch (error) {
      console.error('❌ Error checking model changes:', error)
    }
  }

  // Public methods for other services to broadcast updates
  async broadcastModelUpdate(modelId, status) {
    if (!this.io) return

    const update = {
      type: 'model:status',
      data: {
        modelId,
        ...status
      },
      timestamp: new Date().toISOString()
    }

    this.io.to(`model:${modelId}`).emit('realtime:update', update)
  }

  async broadcastIncident(incident) {
    if (!this.io) return

    const update = {
      type: 'incident:new',
      data: incident,
      timestamp: new Date().toISOString()
    }

    this.io.emit('realtime:update', update)
  }

  async broadcastSyncCompleted(provider, modelsUpdated) {
    if (!this.io) return

    const update = {
      type: 'sync:completed',
      data: {
        provider,
        modelsUpdated,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

    this.io.to('status:global').emit('realtime:update', update)
    
    // Refresh global stats after sync
    await this.sendGlobalStats()
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.connectedClients.clear()
    console.log('🧹 Realtime service cleaned up')
  }
}

// Export singleton instance
const realtimeService = new RealtimeService()
module.exports = { realtimeService }
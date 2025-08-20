// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local'
require('dotenv').config({ path: envFile })

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Import optimized sync service
const { optimizedSyncService } = require('./src/services/optimized-sync.service')

// Feature flag for optimized sync (can be disabled via env)
const USE_OPTIMIZED_SYNC = process.env.USE_OPTIMIZED_SYNC !== 'false'

// Auto-sync data on startup
const shouldAutoSync = process.env.AUTO_SYNC === 'true' || (dev && process.env.DISABLE_AUTO_SYNC !== 'true')

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Add metrics endpoint for monitoring
      if (parsedUrl.pathname === '/api/sync/metrics' && USE_OPTIMIZED_SYNC) {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify(optimizedSyncService.getMetrics()))
        return
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO with enhanced CORS settings
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`]
  
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Export io for use in other services
  global.io = io

  // Initialize sync service based on feature flag
  if (USE_OPTIMIZED_SYNC) {
    console.log('🚀 Using Optimized Sync Service')
    
    try {
      // Initialize optimized sync service
      await optimizedSyncService.initialize()
      
      // Add Socket.IO event handlers for sync control
      io.on('connection', (socket) => {
        console.log(`📡 Client connected: ${socket.id}`)
        
        // Allow clients to request sync metrics
        socket.on('sync:metrics', () => {
          socket.emit('sync:metrics:response', optimizedSyncService.getMetrics())
        })
        
        // Allow authorized clients to trigger sync
        socket.on('sync:force', async (data) => {
          // Add authorization check here if needed
          if (data.models && Array.isArray(data.models)) {
            const result = await optimizedSyncService.forceSyncModels(data.models)
            socket.emit('sync:force:response', result)
          }
        })
        
        // Allow cache clearing
        socket.on('sync:clear-cache', () => {
          const result = optimizedSyncService.clearCache()
          socket.emit('sync:clear-cache:response', result)
        })
        
        socket.on('disconnect', () => {
          console.log(`📡 Client disconnected: ${socket.id}`)
        })
      })
      
      // Periodic metrics broadcast
      setInterval(() => {
        io.emit('sync:metrics:broadcast', optimizedSyncService.getMetrics())
      }, 60000) // Every minute
      
    } catch (err) {
      console.error('❌ Failed to initialize optimized sync service:', err)
      console.log('⚠️ Falling back to standard sync service')
      
      // Fallback to original sync method
      if (shouldAutoSync) {
        try {
          const { initSync } = require('./scripts/init-sync.js')
          await initSync()
        } catch (fallbackErr) {
          console.error('❌ Fallback sync also failed:', fallbackErr)
        }
      }
    }
  } else {
    // Use original sync method
    console.log('📦 Using Standard Sync Service')
    
    if (shouldAutoSync) {
      // Original sync logic
      import('./src/services/github-sync.service.js').then(({ GitHubSyncService }) => {
        console.log('🔄 Running GitHub data sync...')
        GitHubSyncService.forceSync().then(result => {
          if (result.success) {
            console.log(`✅ GitHub sync completed: ${result.message}`)
          } else {
            console.warn(`⚠️ GitHub sync failed: ${result.message}`)
            // Fallback to API sync
            const { initSync } = require('./scripts/init-sync.js')
            console.log('🔄 Falling back to API sync...')
            initSync().catch(err => {
              console.error('⚠️ API sync also failed:', err)
            })
          }
        }).catch(err => {
          console.error('⚠️ GitHub sync error:', err)
          // Fallback to API sync
          const { initSync } = require('./scripts/init-sync.js')
          console.log('🔄 Falling back to API sync...')
          initSync().catch(err => {
            console.error('⚠️ API sync also failed:', err)
          })
        })
      }).catch(() => {
        // If GitHub sync service not available, use API sync
        const { initSync } = require('./scripts/init-sync.js')
        console.log('🔄 Running initial data sync...')
        initSync().catch(err => {
          console.error('⚠️ Initial sync failed:', err)
        })
      })
    }
  }

  // Initialize realtime monitoring service
  try {
    const { realtimeService } = require('./src/services/realtime-server.js')
    realtimeService.initialize(io)
  } catch (err) {
    console.error('❌ Failed to initialize realtime service:', err)
    // Basic WebSocket handling fallback
    io.on('connection', (socket) => {
      if (dev) console.log('Client connected:', socket.id)
      
      socket.on('disconnect', () => {
        if (dev) console.log('Client disconnected:', socket.id)
      })
    })
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('📛 SIGTERM received, shutting down gracefully...')
    
    if (USE_OPTIMIZED_SYNC && optimizedSyncService) {
      await optimizedSyncService.cleanup()
    }
    
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Sync Mode: ${USE_OPTIMIZED_SYNC ? 'Optimized' : 'Standard'}`)
    if (dev) console.log('> WebSocket server initialized')
    
    // Show metrics endpoint if available
    if (USE_OPTIMIZED_SYNC) {
      console.log(`> Metrics available at: http://${hostname}:${port}/api/sync/metrics`)
    }
  })
})
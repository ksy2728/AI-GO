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

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
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

  io.on('connection', (socket) => {
    if (dev) console.log('Client connected:', socket.id)

    // Handle model subscriptions
    socket.on('subscribe:models', (modelIds) => {
      modelIds.forEach((modelId) => {
        socket.join(`model:${modelId}`)
      })
    })

    socket.on('unsubscribe:models', (modelIds) => {
      modelIds.forEach((modelId) => {
        socket.leave(`model:${modelId}`)
      })
    })

    // Handle global status subscription
    socket.on('subscribe:global', () => {
      socket.join('status:global')
    })

    socket.on('unsubscribe:global', () => {
      socket.leave('status:global')
    })

    socket.on('disconnect', () => {
      if (dev) console.log('Client disconnected:', socket.id)
    })
  })

  // Mock status updates
  setInterval(() => {
    const globalStatus = {
      timestamp: new Date().toISOString(),
      avgAvailability: 99.5 + Math.random() * 0.5,
      totalModels: 42,
      operationalModels: 41,
    }
    io.to('status:global').emit('status:global', globalStatus)
  }, 30000)

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    if (dev) console.log('> WebSocket server initialized')
  })
})
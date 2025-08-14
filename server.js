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

  // Initialize realtime monitoring service
  try {
    const { realtimeService } = require('./src/services/realtime-server.js')
    realtimeService.initialize(io)
  } catch (err) {
    console.error('❌ Failed to initialize realtime service:', err)
    // Fallback to basic WebSocket handling
    io.on('connection', (socket) => {
      if (dev) console.log('Client connected:', socket.id)
      
      socket.on('disconnect', () => {
        if (dev) console.log('Client disconnected:', socket.id)
      })
    })
  }
  
  // Export io for use in other services
  global.io = io

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    if (dev) console.log('> WebSocket server initialized')
  })
})
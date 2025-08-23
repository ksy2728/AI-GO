import { NextRequest, NextResponse } from 'next/server'
// Use mock KV for development, Vercel KV in production
import { kv } from '@/lib/mock-kv'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'global'

    // Try to get cached status first
    const cacheKey = `status:${modelId}:${region}`
    const cachedStatus = await kv.get(cacheKey)

    if (cachedStatus) {
      return NextResponse.json(cachedStatus, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })
    }

    // If no cached data, trigger status check
    const statusResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/status-checker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, region })
    })

    if (statusResponse.ok) {
      const status = await statusResponse.json()
      return NextResponse.json(status, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })
    }

    // Fallback response
    return NextResponse.json({
      modelId,
      status: 'operational',
      availability: 99.0,
      responseTime: Math.random() * 500 + 200,
      errorRate: 0,
      region,
      lastChecked: new Date().toISOString(),
      source: 'fallback'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })

  } catch (error) {
    console.error('Real-time status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}

// Server-Sent Events endpoint for real-time streaming
export async function POST(request: NextRequest) {
  const { modelId, region = 'global' } = await request.json()

  if (!modelId) {
    return NextResponse.json({ error: 'Model ID required' }, { status: 400 })
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const sendStatus = async () => {
        try {
          const cacheKey = `status:${modelId}:${region}`
          const status = await kv.get(cacheKey)
          
          if (status) {
            const data = `data: ${JSON.stringify(status)}\n\n`
            controller.enqueue(new TextEncoder().encode(data))
          }
        } catch (error) {
          console.error('SSE error:', error)
        }
      }

      // Send initial status
      sendStatus()

      // Send updates every 30 seconds
      const interval = setInterval(sendStatus, 30000)

      // Cleanup function
      const cleanup = () => {
        clearInterval(interval)
        controller.close()
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
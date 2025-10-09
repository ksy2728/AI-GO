import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
// Simple in-memory cache for realtime status (no external KV dependency)
const realtimeStatusCache: Record<string, any> = {}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params
    const { searchParams } = new URL(request.url)
    const regionParam = (searchParams.get('region') || 'global').toLowerCase()

    const { RealTimeMonitor } = await import('@/services/real-time-monitor.service')

    const metrics = await RealTimeMonitor.getModelMetrics(modelId, undefined, regionParam)

    if (metrics) {
      const throughput = metrics.tokensPerMin > 0
        ? metrics.tokensPerMin
        : Math.max(metrics.requestsPerMin * 60, 0)

      return NextResponse.json({
        modelId,
        status: metrics.status,
        availability: metrics.availability,
        responseTime: metrics.latencyP50,
        errorRate: metrics.errorRate,
        throughput,
        requestsPerMin: metrics.requestsPerMin,
        tokensPerMin: metrics.tokensPerMin,
        region: metrics.region,
        timestamp: metrics.lastUpdated.toISOString()
      })
    }

    return NextResponse.json({
      modelId,
      status: 'unknown',
      availability: null,
      responseTime: null,
      errorRate: null,
      throughput: null,
      requestsPerMin: null,
      tokensPerMin: null,
      region: regionParam,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Real-time status error:', error)
    return NextResponse.json({
      modelId: 'unknown',
      status: 'error',
      availability: null,
      responseTime: null,
      errorRate: null,
      throughput: null,
      requestsPerMin: null,
      tokensPerMin: null,
      region: 'global',
      lastChecked: new Date().toISOString(),
      source: 'error-state'
    }, { status: 500 })
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
          const status = realtimeStatusCache[cacheKey]

          if (status && (!status.expiresAt || Date.now() < status.expiresAt)) {
            const data = `data: ${JSON.stringify(status)}\n\n`
            controller.enqueue(new TextEncoder().encode(data))
          } else {
            const { RealTimeMonitor } = await import('@/services/real-time-monitor.service')
            const metrics = await RealTimeMonitor.getModelMetrics(modelId, undefined, region)

            const throughput = metrics
              ? (metrics.tokensPerMin > 0 ? metrics.tokensPerMin : Math.max(metrics.requestsPerMin * 60, 0))
              : null

            const freshStatus = {
              modelId,
              status: metrics?.status || 'unknown',
              availability: metrics?.availability ?? null,
              responseTime: metrics?.latencyP50 ?? null,
              errorRate: metrics?.errorRate ?? null,
              throughput,
              requestsPerMin: metrics?.requestsPerMin ?? null,
              tokensPerMin: metrics?.tokensPerMin ?? null,
              region: metrics?.region || region,
              lastChecked: (metrics?.lastUpdated ?? new Date()).toISOString(),
              expiresAt: Date.now() + (60 * 1000)
            }
            realtimeStatusCache[cacheKey] = freshStatus
            const data = `data: ${JSON.stringify(freshStatus)}\n\n`
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
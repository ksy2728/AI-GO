import { NextRequest, NextResponse } from 'next/server'
// Simple in-memory cache for realtime status (no external KV dependency)
let realtimeStatusCache: Record<string, any> = {}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'global'

    // Generate region-specific metrics
    let baseResponseTime = 200;
    let baseAvailability = 99.0;
    let baseErrorRate = 0.01;
    
    // Adjust metrics based on region
    switch(region) {
      case 'us-east-1':
      case 'us-east':
        // US East typically has slightly higher response times
        baseResponseTime = 280;
        baseAvailability = 99.2;
        baseErrorRate = 0.015;
        break;
      case 'eu-west-1':
      case 'eu-west':
        // EU West has moderate response times
        baseResponseTime = 240;
        baseAvailability = 99.1;
        baseErrorRate = 0.012;
        break;
      case 'ap-southeast-1':
      case 'ap-southeast':
        // Asia Pacific might have higher latency
        baseResponseTime = 320;
        baseAvailability = 98.9;
        baseErrorRate = 0.018;
        break;
      case 'global':
      default:
        // Global is optimized (CDN/edge)
        baseResponseTime = 200;
        baseAvailability = 99.3;
        baseErrorRate = 0.008;
        break;
    }
    
    // Use real data instead of artificial variation
    const { RealTimeMonitor } = await import('@/services/real-time-monitor.service');

    try {
      const metrics = await RealTimeMonitor.getModelMetrics(modelId, 'unknown');

      if (metrics) {
        return NextResponse.json({
          modelId,
          status: metrics.status,
          availability: metrics.availability,
          responseTime: metrics.latencyP50,
          errorRate: metrics.errorRate,
          region: 'global',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Failed to get real-time status for ${modelId}:`, error);
    }

    // No real data available - return null status
    return NextResponse.json({
      modelId,
      status: 'unknown',
      availability: null,
      responseTime: null,
      errorRate: null,
      region: 'global',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Real-time status error:', error);
    // Return error status instead of fake operational data
    return NextResponse.json({
      modelId: 'unknown',
      status: 'error',
      availability: null,
      responseTime: null,
      errorRate: null,
      region: 'global',
      lastChecked: new Date().toISOString(),
      source: 'error-state'
    }, { status: 500 });
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
            // Generate fresh status from real data
            const { RealTimeMonitor } = await import('@/services/real-time-monitor.service');
            const metrics = await RealTimeMonitor.getModelMetrics(modelId, 'unknown');

            const freshStatus = {
              modelId,
              status: metrics?.status || 'unknown',
              availability: metrics?.availability || null,
              responseTime: metrics?.latencyP50 || null,
              errorRate: metrics?.errorRate || null,
              region,
              lastChecked: new Date().toISOString(),
              expiresAt: Date.now() + (60 * 1000) // 1 minute
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
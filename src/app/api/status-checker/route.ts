import { NextRequest, NextResponse } from 'next/server'
// Use mock KV for development, Vercel KV in production
import { kv } from '@/lib/mock-kv'

interface ServerStatus {
  modelId: string
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  responseTime: number
  errorRate: number
  region: string
  lastChecked: string
}

interface StatusCheckResult {
  success: boolean
  responseTime: number
  error?: string
}

const OPENAI_API_BASE = 'https://api.openai.com/v1'
const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1'

const MODEL_ENDPOINTS = {
  'gpt-4o': { provider: 'openai', endpoint: '/models' },
  'gpt-4o-mini': { provider: 'openai', endpoint: '/models' },
  'gpt-4-turbo': { provider: 'openai', endpoint: '/models' },
  'gpt-3.5-turbo': { provider: 'openai', endpoint: '/models' },
  'claude-3-5-sonnet': { provider: 'anthropic', endpoint: '/models' },
  'claude-3-5-haiku': { provider: 'anthropic', endpoint: '/models' },
  'claude-3-opus': { provider: 'anthropic', endpoint: '/models' },
  'gemini-pro': { provider: 'google', endpoint: '/models' },
  'gemini-1.5-pro': { provider: 'google', endpoint: '/models' },
}

async function checkServerStatus(modelId: string, region: string = 'global'): Promise<StatusCheckResult> {
  const modelConfig = MODEL_ENDPOINTS[modelId as keyof typeof MODEL_ENDPOINTS]
  if (!modelConfig) {
    return { success: false, responseTime: 0, error: 'Model not supported' }
  }

  const startTime = Date.now()
  let baseUrl: string
  let headers: Record<string, string>

  switch (modelConfig.provider) {
    case 'openai':
      baseUrl = OPENAI_API_BASE
      headers = {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'test-key'}`,
        'Content-Type': 'application/json'
      }
      break
    case 'anthropic':
      baseUrl = ANTHROPIC_API_BASE
      headers = {
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'test-key',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
      break
    default:
      return { success: false, responseTime: 0, error: 'Provider not implemented' }
  }

  try {
    const response = await fetch(`${baseUrl}${modelConfig.endpoint}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return { success: true, responseTime }
    } else if (response.status === 429) {
      return { success: false, responseTime, error: 'Rate limited' }
    } else {
      return { success: false, responseTime, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { 
      success: false, 
      responseTime, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function calculateStatus(result: StatusCheckResult): ServerStatus['status'] {
  if (!result.success) return 'outage'
  if (result.responseTime > 5000) return 'degraded'
  return 'operational'
}

function calculateAvailability(status: ServerStatus['status'], errorRate: number): number {
  switch (status) {
    case 'operational': return Math.max(98, 100 - errorRate)
    case 'degraded': return Math.max(90, 95 - errorRate)
    case 'outage': return Math.max(0, 50 - errorRate)
  }
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const { modelId, region = 'global' } = await req.json()
    
    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 })
    }

    const cacheKey = `status:${modelId}:${region}`
    const cachedStatus = await kv.get<ServerStatus>(cacheKey)

    // Return cached data if less than 5 minutes old
    if (cachedStatus) {
      const cacheAge = Date.now() - new Date(cachedStatus.lastChecked).getTime()
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        return NextResponse.json(cachedStatus)
      }
    }

    // Perform actual status check
    const result = await checkServerStatus(modelId, region)
    const status = calculateStatus(result)
    const errorRate = result.success ? 0 : 100
    const availability = calculateAvailability(status, errorRate)

    const serverStatus: ServerStatus = {
      modelId,
      status,
      availability,
      responseTime: result.responseTime,
      errorRate,
      region,
      lastChecked: new Date().toISOString()
    }

    // Cache the result for 5 minutes
    await kv.set(cacheKey, serverStatus, { ex: 300 })

    return NextResponse.json(serverStatus)

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export const config = {
  runtime: 'edge'
}
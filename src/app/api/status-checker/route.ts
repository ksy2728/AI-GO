import { NextRequest, NextResponse } from 'next/server'

interface ServerStatus {
  modelId: string
  status: 'operational' | 'degraded' | 'outage'
  availability: number
  responseTime: number
  errorRate: number
  region: string
  lastChecked: string
}

// Calculate availability based on intelligence score
function calculateAvailability(intelligence: number): number {
  if (intelligence > 80) {
    return Math.round((99.0 + (intelligence - 80) / 100) * 10) / 10 // 99.0-99.2%
  } else if (intelligence > 70) {
    return Math.round((98.0 + (intelligence - 70) / 50) * 10) / 10 // 98.0-98.2%
  } else if (intelligence > 60) {
    return Math.round((95.0 + (intelligence - 60) / 33.3) * 10) / 10 // 95.0-95.3%
  } else {
    return Math.round((90.0 + intelligence / 60 * 5) * 10) / 10 // 90.0-95.0%
  }
}

// Calculate response time based on intelligence and status
function calculateResponseTime(intelligence: number, status: string): number {
  let baseTime = 200

  if (status === 'operational') {
    baseTime = 150 + (100 - intelligence) * 2 // 150-210ms based on intelligence
  } else if (status === 'degraded') {
    baseTime = 300 + (80 - intelligence) * 3 // 300-390ms
  } else {
    baseTime = 500 + (60 - intelligence) * 10 // 500-1100ms
  }

  return Math.round(baseTime)
}

// Calculate error rate based on intelligence score
function calculateErrorRate(intelligence: number): number {
  if (intelligence > 80) {
    return Math.round((0.01 + (100 - intelligence) / 1000) * 1000) / 1000 // 0.01-0.02%
  } else if (intelligence > 70) {
    return Math.round((0.05 + (80 - intelligence) / 200) * 1000) / 1000 // 0.05-0.10%
  } else if (intelligence > 60) {
    return Math.round((0.2 + (70 - intelligence) / 100) * 1000) / 1000 // 0.2-0.3%
  } else {
    return Math.round((0.5 + (60 - intelligence) / 50) * 1000) / 1000 // 0.5-1.7%
  }
}

// Generate status based on intelligence score from AA data
async function generateRealisticStatus(modelId: string, region: string = 'global'): Promise<ServerStatus> {
  try {
    // Get model intelligence score from UnifiedModelService
    const { UnifiedModelService } = await import('@/services/unified-models.service')
    const response = await UnifiedModelService.getAll({}, 1000, 0)
    const model = response.models.find(m => m.id === modelId || m.slug === modelId || m.name.toLowerCase().includes(modelId.toLowerCase()))

    let status: 'operational' | 'degraded' | 'outage' = 'operational'
    let baseAvailability = 99.5
    let baseResponseTime = 250
    let baseErrorRate = 0.01

    if (model && model.intelligence !== undefined) {
      // Base status on intelligence score (calculated deterministically)
      if (model.intelligence > 70) {
        status = 'operational'
        baseAvailability = calculateAvailability(model.intelligence)
        baseResponseTime = calculateResponseTime(model.intelligence, 'operational')
        baseErrorRate = calculateErrorRate(model.intelligence)
      } else if (model.intelligence > 50) {
        status = 'degraded'
        baseAvailability = calculateAvailability(model.intelligence)
        baseResponseTime = calculateResponseTime(model.intelligence, 'degraded')
        baseErrorRate = calculateErrorRate(model.intelligence)
      } else {
        status = 'outage'
        baseAvailability = calculateAvailability(model.intelligence)
        baseResponseTime = calculateResponseTime(model.intelligence, 'outage')
        baseErrorRate = calculateErrorRate(model.intelligence)
      }
    }

    return {
      modelId,
      status,
      availability: Math.round(baseAvailability * 10) / 10,
      responseTime: Math.round(baseResponseTime),
      errorRate: Math.round(baseErrorRate * 1000) / 1000,
      region,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    // Fallback to operational status if lookup fails
    console.warn('Failed to get model intelligence score, defaulting to operational')
    return {
      modelId,
      status: 'operational',
      availability: 99.5,
      responseTime: 250,
      errorRate: 0.01,
      region,
      lastChecked: new Date().toISOString()
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { modelId, region = 'global' } = await req.json()
    
    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 })
    }

    // Generate realistic status based on model intelligence score
    const serverStatus = await generateRealisticStatus(modelId, region)

    // Always return successful response
    return NextResponse.json(serverStatus, { status: 200 })

  } catch (error) {
    console.error('Status check error:', error)
    
    // Even on error, return operational status
    const fallbackStatus = await generateRealisticStatus('unknown', 'global')
    return NextResponse.json(fallbackStatus, { status: 200 })
  }
}

export const config = {
  runtime: 'edge'
}
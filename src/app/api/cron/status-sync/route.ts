import { NextRequest, NextResponse } from 'next/server'
// Simple in-memory cache for status sync results (no external KV dependency)
let statusSyncCache: Record<string, any> = {}

interface ModelConfig {
  id: string
  provider: string
  regions: string[]
}

// Models to monitor with their configurations
const MONITORED_MODELS: ModelConfig[] = [
  { id: 'gpt-4o', provider: 'openai', regions: ['global', 'us-east-1'] },
  { id: 'gpt-4o-mini', provider: 'openai', regions: ['global', 'us-east-1'] },
  { id: 'gpt-4-turbo', provider: 'openai', regions: ['global', 'us-east-1'] },
  { id: 'gpt-3.5-turbo', provider: 'openai', regions: ['global', 'us-east-1'] },
  { id: 'claude-3-5-sonnet', provider: 'anthropic', regions: ['global', 'us-east-1'] },
  { id: 'claude-3-5-haiku', provider: 'anthropic', regions: ['global', 'us-east-1'] },
  { id: 'claude-3-opus', provider: 'anthropic', regions: ['global', 'us-east-1'] },
]

async function checkModelStatus(modelId: string, region: string) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/status-checker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, region })
    })

    if (response.ok) {
      return await response.json()
    } else {
      throw new Error(`Status check failed: ${response.status}`)
    }
  } catch (error) {
    console.error(`Failed to check status for ${modelId} in ${region}:`, error)
    return null
  }
}

export async function POST(req: NextRequest) {
  // Verify this is a cron request
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const startTime = Date.now()
    const results = []
    
    console.log(`🔄 Starting status sync for ${MONITORED_MODELS.length} models`)

    // Check status for each model in parallel
    const statusChecks = MONITORED_MODELS.flatMap(model =>
      model.regions.map(region => 
        checkModelStatus(model.id, region)
          .then(result => ({ modelId: model.id, region, result }))
      )
    )

    const allResults = await Promise.allSettled(statusChecks)
    
    let successCount = 0
    let errorCount = 0

    for (const result of allResults) {
      if (result.status === 'fulfilled' && result.value.result) {
        successCount++
        results.push(result.value)
      } else {
        errorCount++
        console.error('Status check failed:', result)
      }
    }

    // Store summary metrics
    const syncSummary = {
      timestamp: new Date().toISOString(),
      totalChecks: statusChecks.length,
      successCount,
      errorCount,
      duration: Date.now() - startTime,
      results: results.map(r => ({
        modelId: r.modelId,
        region: r.region,
        status: r.result?.status || 'unknown',
        responseTime: r.result?.responseTime || 0
      }))
    }

    // Cache sync summary in memory (with timestamp for expiration)
    statusSyncCache['latest'] = {
      ...syncSummary,
      expiresAt: Date.now() + (3600 * 1000) // 1 hour from now
    }

    console.log(`✅ Status sync completed: ${successCount} success, ${errorCount} errors in ${syncSummary.duration}ms`)

    return NextResponse.json({
      success: true,
      summary: syncSummary
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

export const config = {
  runtime: 'edge',
  maxDuration: 300 // 5 minutes max
}
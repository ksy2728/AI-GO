import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { UnifiedModelService } from '@/services/unified-models.service'

export async function GET() {
  try {
    // Try database first, fallback to temporary data
    let providers: any[] = []
    try {
      providers = (await ModelService.getProvidersSummary()) as any[]
    } catch (error) {
      console.warn('⚠️ Database service failed, using UnifiedModelService:', error instanceof Error ? error.message : 'Unknown error')
      // Get providers from UnifiedModelService models
      const response = await UnifiedModelService.getAll({}, 1000, 0)
      const providerMap = new Map()
      response.models.forEach(model => {
        const provider = model.provider
        if (!providerMap.has(provider)) {
          providerMap.set(provider, {
            id: provider.toLowerCase().replace(/\s+/g, '-'),
            slug: provider.toLowerCase().replace(/\s+/g, '-'),
            name: provider,
            modelCount: 0
          })
        }
        providerMap.get(provider).modelCount++
      })
      providers = Array.from(providerMap.values())
    }

    return NextResponse.json({
      providers,
      total: providers.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error fetching providers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch providers',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
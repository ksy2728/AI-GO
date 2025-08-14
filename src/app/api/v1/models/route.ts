import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const modality = searchParams.get('modality')
    const capability = searchParams.get('capability')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filters
    const filters: any = {
      limit,
      offset,
    }

    if (provider) {
      filters.provider = provider
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    if (modality) {
      filters.modalities = [modality]
    }

    if (capability) {
      filters.capabilities = [capability]
    }

    // Try database first, fallback to temporary data
    let models: any[] = []
    try {
      models = (await ModelService.getAll(filters)) as any[]
    } catch (error) {
      console.warn('⚠️ Database service failed, using temporary data:', error instanceof Error ? error.message : 'Unknown error')
      models = (await TempDataService.getAllModels(filters)) as any[]
    }

    // Filter by modality and capability if needed (client-side filtering for complex JSON fields)
    let filteredModels = models || []

    if (modality && !filters.modalities) {
      filteredModels = filteredModels.filter((model: any) =>
        model.modalities.some((m: string) => 
          m.toLowerCase().includes(modality.toLowerCase())
        )
      )
    }

    if (capability && !filters.capabilities) {
      filteredModels = filteredModels.filter((model: any) =>
        model.capabilities.some((c: string) => 
          c.toLowerCase().includes(capability.toLowerCase())
        )
      )
    }

    return NextResponse.json({
      models: filteredModels,
      total: filteredModels.length,
      limit,
      offset,
      timestamp: new Date().toISOString(),
      cached: false, // This will be set by the service layer
    })
  } catch (error) {
    console.error('❌ Error in models API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
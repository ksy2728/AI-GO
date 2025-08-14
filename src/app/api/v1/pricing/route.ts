import { NextRequest, NextResponse } from 'next/server'
import { TempDataService } from '@/services/temp-data.service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      provider: searchParams.get('provider'),
      model: searchParams.get('model'),
      tier: searchParams.get('tier'),
      region: searchParams.get('region'),
      currency: searchParams.get('currency'),
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    let pricing
    
    // Try database first, fallback to temporary data
    try {
      // Build Prisma query
      const where: any = {}
      
      if (filters.provider) {
        const provider = await prisma.provider.findUnique({
          where: { slug: filters.provider }
        })
        if (provider) {
          where.model = { providerId: provider.id }
        }
      }
      
      if (filters.model) {
        const model = await prisma.model.findFirst({
          where: { slug: filters.model }
        })
        if (model) {
          where.modelId = model.id
        }
      }
      
      if (filters.tier) {
        where.tier = filters.tier
      }
      
      if (filters.region) {
        where.region = filters.region
      }
      
      if (filters.currency) {
        where.currency = filters.currency.toUpperCase()
      }
      
      // Add current date filter
      where.effectiveTo = null
      
      const [data, total] = await Promise.all([
        prisma.pricing.findMany({
          where,
          include: {
            model: {
              include: {
                provider: true
              }
            }
          },
          skip: filters.offset,
          take: filters.limit,
        }),
        prisma.pricing.count({ where })
      ])
      
      pricing = {
        data: data.map(p => ({
          id: p.id,
          modelId: p.modelId,
          tier: p.tier,
          region: p.region,
          currency: p.currency,
          inputPerMillion: p.inputPerMillion,
          outputPerMillion: p.outputPerMillion,
          imagePerUnit: p.imagePerUnit,
          audioPerMinute: p.audioPerMinute,
          videoPerMinute: p.videoPerMinute,
          finetuningPerMillion: p.fineTuningPerMillion,
          volumeDiscounts: p.volumeDiscounts,
          effectiveFrom: p.effectiveFrom,
          effectiveTo: p.effectiveTo,
          model: p.model ? {
            id: p.model.id,
            slug: p.model.slug,
            name: p.model.name,
            provider: {
              id: p.model.provider.id,
              slug: p.model.provider.slug,
              name: p.model.provider.name,
            }
          } : null,
        })),
        total,
        cached: false,
      }
    } catch (error) {
      console.warn('⚠️ Database service failed, using temporary data:', error instanceof Error ? error.message : 'Unknown error')
      pricing = await TempDataService.getPricing(filters)
    }

    return NextResponse.json({
      pricing: pricing.data,
      total: pricing.total,
      limit: filters.limit,
      offset: filters.offset,
      timestamp: new Date().toISOString(),
      cached: pricing.cached || false,
    })
  } catch (error) {
    console.error('❌ Error fetching pricing:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch pricing data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
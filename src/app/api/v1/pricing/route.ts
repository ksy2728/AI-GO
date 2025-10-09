import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { UnifiedModelService } from '@/services/unified-models.service'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Disable caching for this route
export const revalidate = 0
export const dynamic = 'force-dynamic'

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
    
    // Try to read pricing data from JSON file first
    try {
      const pricingDataPath = path.join(process.cwd(), 'data', 'pricing-data.json')
      const pricingDataRaw = await fs.readFile(pricingDataPath, 'utf-8')
      const pricingData = JSON.parse(pricingDataRaw)
      
      let filteredPricing = pricingData.pricing
      
      // Apply filters
      if (filters.provider) {
        filteredPricing = filteredPricing.filter((p: any) => 
          p.provider.toLowerCase() === filters.provider?.toLowerCase()
        )
      }
      
      if (filters.tier) {
        filteredPricing = filteredPricing.filter((p: any) => 
          p.tier === filters.tier
        )
      }
      
      // Apply pagination
      const start = filters.offset
      const end = filters.offset + filters.limit
      const paginatedPricing = filteredPricing.slice(start, end)
      
      pricing = {
        data: paginatedPricing,
        total: filteredPricing.length,
        cached: false,
      }
      
      return NextResponse.json({
        pricing: pricing.data,
        total: pricing.total,
        limit: filters.limit,
        offset: filters.offset,
        timestamp: new Date().toISOString(),
        cached: false,
      })
    } catch (fileError) {
      console.warn('⚠️ Could not read pricing data file, trying database:', fileError)
    }
    
    // Try database as fallback
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
        data: data.map((p: any) => ({
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
      console.warn('⚠️ Database service failed, using UnifiedModelService pricing:', error instanceof Error ? error.message : 'Unknown error')
      // Extract pricing from unified models
      const response = await UnifiedModelService.getAll({}, filters.limit, filters.offset)
      const pricingData = response.models.map(model => ({
        id: model.id,
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        inputPrice: model.priceInput || 0,
        outputPrice: model.priceOutput || 0,
        currency: 'USD'
      })).filter(p => p.inputPrice > 0 || p.outputPrice > 0)

      pricing = {
        data: pricingData,
        total: pricingData.length,
        cached: true
      }
    }

    return NextResponse.json({
      pricing: pricing.data || pricing,
      total: pricing.total || (Array.isArray(pricing) ? pricing.length : 0),
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
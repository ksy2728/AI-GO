#!/usr/bin/env tsx
/**
 * Real AA Data Sync Script
 * Fetches actual data from Artificial Analysis and updates database
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'
import * as cheerio from 'cheerio'
import { AAFlightParser } from '@/lib/aa-flight-parser'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()
const flightParser = new AAFlightParser()

interface AAModel {
  name: string
  provider: string
  intelligenceScore: number
  outputSpeed: number
  inputPrice: number
  outputPrice: number
  contextWindow?: number
  rank?: number
}

/**
 * Fetch real data from Artificial Analysis (API first, then scraping fallback)
 */
async function fetchAAData(): Promise<AAModel[]> {
  console.log('🔄 Fetching data from Artificial Analysis...')
  const startTime = Date.now()

  try {
    // Try API first if token is available
    const apiToken = process.env.artificialanalysis_API_TOKEN
    if (apiToken) {
      try {
        console.log('📡 Trying AA API v2...')
        const apiResponse = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', {
          method: 'GET',
          headers: {
            'x-api-key': apiToken,
            'Accept': 'application/json'
          }
        })

        if (apiResponse.ok) {
          const apiData = await apiResponse.json()

          // Parse API response structure: { status: 200, data: [...] }
          if (apiData.status === 200 && Array.isArray(apiData.data)) {
            console.log(`✅ AA API returned ${apiData.data.length} models`)
            const models = parseAAApiData(apiData.data)
            console.log(`✅ Successfully parsed ${models.length} models from API in ${Date.now() - startTime}ms`)
            return models
          }
        } else {
          console.warn(`⚠️ AA API returned ${apiResponse.status}, falling back to scraping`)
        }
      } catch (apiError) {
        console.warn('⚠️ AA API failed, falling back to scraping:', apiError)
      }
    } else {
      console.warn('⚠️ No AA API token found, using scraping fallback')
    }

    // Fallback to HTML scraping
    console.log('📄 Fetching AA leaderboard page...')
    const pageUrl = 'https://artificialanalysis.ai/leaderboards/models'
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!response.ok) {
      const error = `AA_SYNC_FAILURE: HTTP ${response.status} - ${response.statusText}`
      console.error(error, {
        url: pageUrl,
        status: response.status,
        lastSuccess: flightParser.getLastSuccessTime()?.toISOString() || 'never'
      })
      throw new Error(error)
    }

    const html = await response.text()
    console.log(`📦 Received HTML: ${html.length} bytes`)

    // Try Flight parser first (handles new streaming format)
    let rawModels = flightParser.parseModels(html)

    // Fallback to table parser if Flight parser returns nothing
    if (rawModels.length === 0) {
      console.warn('⚠️ Flight parser returned 0 models, trying table fallback')
      rawModels = flightParser.parseTableFallback(html)
    }

    // If still nothing, this is a critical failure
    if (rawModels.length === 0) {
      const error = 'AA_SYNC_FAILURE: All parsers returned 0 models'
      console.error(error, {
        htmlLength: html.length,
        htmlPreview: html.substring(0, 500),
        lastSuccess: flightParser.getLastSuccessTime()?.toISOString() || 'never',
        duration: Date.now() - startTime
      })
      throw new Error(error)
    }

    // Convert to our internal format
    const models = parseAAApiData(rawModels)

    console.log(`✅ Successfully parsed ${models.length} models in ${Date.now() - startTime}ms`)
    return models

  } catch (error: any) {
    const errorMsg = error.message || String(error)
    console.error('❌ AA_SYNC_FAILURE:', errorMsg, {
      stack: error.stack,
      lastSuccess: flightParser.getLastSuccessTime()?.toISOString() || 'never',
      duration: Date.now() - startTime
    })
    throw error
  }
}

/**
 * Parse API response data (handles both API v2 and scraped data formats)
 */
function parseAAApiData(models: any[]): AAModel[] {
  return models.map((model, index) => {
    // API v2 format
    if (model.evaluations && model.median_output_tokens_per_second !== undefined) {
      return {
        name: model.name,
        provider: model.model_creator?.slug || inferProvider(model.name),
        intelligenceScore: parseFloat(model.evaluations?.artificial_analysis_intelligence_index || 0),
        outputSpeed: parseFloat(model.median_output_tokens_per_second || 0),
        inputPrice: parseFloat(model.pricing?.price_1m_input_tokens || 0),
        outputPrice: parseFloat(model.pricing?.price_1m_output_tokens || 0),
        contextWindow: parseInt(model.context_window || 0),
        rank: index + 1
      }
    }

    // Scraped format (legacy)
    return {
      name: model.name || model.model_name,
      provider: model.organization || model.provider || inferProvider(model.name || model.model_name),
      intelligenceScore: parseFloat(model.quality_index || model.intelligence_score || 0),
      outputSpeed: parseFloat(model.tokens_per_second || model.output_speed || 0),
      inputPrice: parseFloat(model.price_per_million_input_tokens || model.input_price || 0),
      outputPrice: parseFloat(model.price_per_million_output_tokens || model.output_price || 0),
      contextWindow: parseInt(model.context_window || model.context_length || 0),
      rank: model.rank || index + 1
    }
  }).filter(m => m.name && m.intelligenceScore > 0)
}

/**
 * Scrape models from HTML
 */
function scrapeAAModels(html: string): AAModel[] {
  const $ = cheerio.load(html)
  const models: AAModel[] = []

  // Look for __NEXT_DATA__ or similar JSON data
  $('script').each((_, elem) => {
    const scriptContent = $(elem).html() || ''

    if (scriptContent.includes('__NEXT_DATA__')) {
      try {
        const match = scriptContent.match(/__NEXT_DATA__\s*=\s*({.*?})\s*;?\s*$/s)
        if (match) {
          const data = JSON.parse(match[1])
          const pageProps = data?.props?.pageProps

          if (pageProps?.models || pageProps?.initialData?.models) {
            const modelList = pageProps.models || pageProps.initialData.models
            models.push(...parseAAApiData(modelList))
          }
        }
      } catch (e) {
        console.warn('Failed to parse NEXT_DATA:', e)
      }
    }
  })

  // If no data found in scripts, try parsing the table
  if (models.length === 0) {
    $('table tbody tr').each((index, row) => {
      const cells = $(row).find('td')
      if (cells.length >= 4) {
        const name = $(cells[0]).text().trim()
        const score = parseFloat($(cells[1]).text().replace(/[^\d.]/g, ''))
        const speed = parseFloat($(cells[2]).text().replace(/[^\d.]/g, ''))

        if (name && !isNaN(score)) {
          models.push({
            name,
            provider: inferProvider(name),
            intelligenceScore: score,
            outputSpeed: speed || 0,
            inputPrice: 0,
            outputPrice: 0,
            rank: index + 1
          })
        }
      }
    })
  }

  console.log(`📊 Scraped ${models.length} models from HTML`)
  return models
}

/**
 * Infer provider from model name
 */
function inferProvider(name: string): string {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('gpt') || nameLower.includes('openai')) return 'openai'
  if (nameLower.includes('claude') || nameLower.includes('anthropic')) return 'anthropic'
  if (nameLower.includes('gemini') || nameLower.includes('google')) return 'google'
  if (nameLower.includes('llama') || nameLower.includes('meta')) return 'meta'
  if (nameLower.includes('mistral')) return 'mistral'
  if (nameLower.includes('cohere')) return 'cohere'
  if (nameLower.includes('deepseek')) return 'deepseek'
  return 'other'
}

/**
 * Normalize model name to slug
 * "Claude Sonnet 4.5" → "claude-sonnet-4-5"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.\s]+/g, '-')      // Convert dots and spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')   // Remove non-alphanumeric except hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '')        // Trim leading/trailing hyphens
}

/**
 * Sync AA data to database
 */
async function syncToDatabase(aaModels: AAModel[]) {
  console.log('💾 Syncing to database...')

  let created = 0
  let updated = 0
  let failed = 0

  // Ensure providers exist
  const providerMap = new Map<string, string>()
  const uniqueProviders = [...new Set(aaModels.map(m => m.provider))]

  for (const providerName of uniqueProviders) {
    const slug = toSlug(providerName)
    let provider = await prisma.provider.findUnique({
      where: { slug }
    })

    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          slug,
          name: providerName,
          websiteUrl: `https://${slug}.com`,
          documentationUrl: `https://docs.${slug}.com`,
          regions: JSON.stringify(['global'])
        }
      })
      console.log(`  Created provider: ${providerName}`)
    }

    providerMap.set(providerName, provider.id)
  }

  // Sync models
  for (const aaModel of aaModels) {
    try {
      const slug = toSlug(aaModel.name)
      const providerId = providerMap.get(aaModel.provider)!

      // Check if model exists
      const existing = await prisma.model.findUnique({
        where: { slug }
      })

      const modelData = {
        name: aaModel.name,
        slug,
        providerId,
        description: `${aaModel.name} - Intelligence Score: ${aaModel.intelligenceScore}`,
        foundationModel: aaModel.name.split(' ')[0],
        contextWindow: aaModel.contextWindow || 128000,
        maxOutputTokens: Math.min(aaModel.contextWindow || 4096, 4096),
        isActive: true,
        // Update actual database columns
        intelligenceScore: Math.round(aaModel.intelligenceScore),
        outputSpeed: Math.round(aaModel.outputSpeed),
        inputPrice: aaModel.inputPrice > 0 ? aaModel.inputPrice : null,
        outputPrice: aaModel.outputPrice > 0 ? aaModel.outputPrice : null,
        dataSource: 'artificial-analysis',
        lastVerified: new Date(),
        metadata: JSON.stringify({
          aa: {
            intelligenceScore: aaModel.intelligenceScore,
            outputSpeed: aaModel.outputSpeed,
            rank: aaModel.rank,
            inputPrice: aaModel.inputPrice,
            outputPrice: aaModel.outputPrice,
            lastUpdated: new Date().toISOString(),
            source: 'official'
          }
        })
      }

      if (existing) {
        await prisma.model.update({
          where: { id: existing.id },
          data: modelData
        })
        updated++
      } else {
        const model = await prisma.model.create({
          data: {
            ...modelData,
            releasedAt: new Date(),
            modalities: JSON.stringify(['text']),
            capabilities: JSON.stringify(['general']),
            apiVersion: 'v1'
          }
        })

        // Create pricing if we have data
        if (aaModel.inputPrice > 0 || aaModel.outputPrice > 0) {
          await prisma.pricing.create({
            data: {
              modelId: model.id,
              inputPerMillion: aaModel.inputPrice,
              outputPerMillion: aaModel.outputPrice,
              tier: 'standard',
              region: 'global',
              currency: 'USD',
              effectiveFrom: new Date()
            }
          })
        }

        created++
      }

    } catch (error) {
      console.error(`Failed to sync ${aaModel.name}:`, error)
      failed++
    }
  }

  console.log(`\n📈 Sync Summary:`)
  console.log(`  ✅ Created: ${created} models`)
  console.log(`  🔄 Updated: ${updated} models`)
  console.log(`  ❌ Failed: ${failed} models`)

  return { created, updated, failed }
}

/**
 * Calculate average intelligence score from models
 */
function calculateAverageIntelligence(models: AAModel[]): number {
  if (models.length === 0) return 0

  const validScores = models
    .map(m => m.intelligenceScore)
    .filter(score => score > 0)

  if (validScores.length === 0) return 0

  const sum = validScores.reduce((acc, score) => acc + score, 0)
  return sum / validScores.length
}

/**
 * Filter models based on performance
 */
function filterModelsByPerformance(models: AAModel[]): AAModel[] {
  // Check if filtering is enabled via environment variable
  const enableFilter = process.env.AA_ENABLE_PERFORMANCE_FILTER !== 'false'
  const customThreshold = process.env.AA_MIN_INTELLIGENCE ?
    parseInt(process.env.AA_MIN_INTELLIGENCE) : null

  if (!enableFilter) {
    console.log('⚙️ Performance filtering is disabled')
    return models
  }

  const originalCount = models.length

  // Use custom threshold or calculate average
  let threshold: number
  if (customThreshold !== null) {
    threshold = customThreshold
    console.log(`📊 Using custom intelligence threshold: ${threshold}`)
  } else {
    threshold = calculateAverageIntelligence(models)
    console.log(`📊 Calculated average intelligence score: ${threshold.toFixed(2)}`)
  }

  // Filter out below-threshold models
  const filteredModels = models.filter(m => m.intelligenceScore >= threshold)

  const removedCount = originalCount - filteredModels.length
  console.log(`🎯 Performance filtering results:`)
  console.log(`  - Original models: ${originalCount}`)
  console.log(`  - Threshold: ${threshold.toFixed(2)}`)
  console.log(`  - Models kept: ${filteredModels.length}`)
  console.log(`  - Models filtered out: ${removedCount}`)

  return filteredModels
}

/**
 * Clear all caches (in-memory and Redis)
 */
async function clearAllCaches(): Promise<void> {
  try {
    // 1. Clear UnifiedModelService in-memory cache
    try {
      // Dynamically import to avoid circular dependencies
      const { UnifiedModelService } = await import('./unified-models.service')
      UnifiedModelService.clearCache()
      console.log('  ✅ Cleared UnifiedModelService cache')
    } catch (err) {
      console.warn('  ⚠️ Could not clear UnifiedModelService cache:', err)
    }

    // 2. Clear Redis cache if available
    try {
      const { cache } = await import('@/lib/redis')
      if (cache) {
        // Clear AA-specific cache keys
        const keys = [
          'aa:leaderboard:data',
          'aa:models:*',
          'models:unified:*',
          'models:*'
        ]

        for (const pattern of keys) {
          try {
            // Delete keys matching pattern
            if (pattern.includes('*')) {
              // For wildcard patterns, we'd need to scan and delete
              console.log(`  📝 Would clear Redis pattern: ${pattern}`)
            } else {
              await cache.del(pattern)
              console.log(`  ✅ Cleared Redis key: ${pattern}`)
            }
          } catch (err) {
            console.warn(`  ⚠️ Could not clear Redis key ${pattern}:`, err)
          }
        }
      }
    } catch (err) {
      console.warn('  ⚠️ Redis not available or error:', err)
    }

    console.log('  ✨ Cache clearing completed')
  } catch (error) {
    console.error('  ❌ Error during cache clearing:', error)
    // Don't throw - cache clearing failure shouldn't fail the sync
  }
}

/**
 * Main sync function
 */
async function syncAAData() {
  try {
    console.log('🚀 Starting AA data sync...')

    // Fetch real data from API
    let aaModels = await fetchAAData()

    // Also check intelligence-index.json for additional models
    try {
      const indexPath = path.resolve(process.cwd(), 'data/intelligence-index.json')
      if (require('fs').existsSync(indexPath)) {
        const indexData = JSON.parse(require('fs').readFileSync(indexPath, 'utf8'))

        // Merge models from intelligence-index that aren't in API response
        const apiModelNames = new Set(aaModels.map(m => m.name))
        const additionalModels = indexData.models
          .filter((m: any) => !apiModelNames.has(m.name))
          .map((m: any) => ({
            name: m.name,
            provider: m.provider?.toLowerCase() || inferProvider(m.name),
            intelligenceScore: m.intelligenceIndex || m.intelligenceScore,
            outputSpeed: 100, // Default speed for index models
            inputPrice: 0,
            outputPrice: 0,
            rank: m.rank
          }))

        if (additionalModels.length > 0) {
          console.log(`📄 Found ${additionalModels.length} additional models in intelligence-index.json`)
          aaModels.push(...additionalModels)
        }
      }
    } catch (e) {
      console.log('📄 intelligence-index.json not found or invalid, using API data only')
    }

    if (aaModels.length === 0) {
      throw new Error('No models fetched from any source')
    }

    console.log(`\n📋 Fetched ${aaModels.length} total models from AA sources`)

    // Apply performance filtering
    aaModels = filterModelsByPerformance(aaModels)

    console.log('\n📊 Top 5 models after filtering:')
    aaModels.slice(0, 5).forEach(m => {
      console.log(`  - ${m.name}: Score=${m.intelligenceScore}, Speed=${m.outputSpeed}`)
    })

    // Sync to database
    const result = await syncToDatabase(aaModels)

    // Clear all caches after successful sync
    console.log('\n🗑️ Clearing caches...')
    await clearAllCaches()

    console.log('\n✨ Sync completed successfully!')
    return result

  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  syncAAData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { syncAAData, fetchAAData, filterModelsByPerformance, calculateAverageIntelligence }
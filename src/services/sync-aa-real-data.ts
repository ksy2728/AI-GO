#!/usr/bin/env tsx
/**
 * Real AA Data Sync Script
 * Fetches actual data from Artificial Analysis and updates database
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'
import * as cheerio from 'cheerio'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

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
 * Fetch real data from Artificial Analysis website
 */
async function fetchAAData(): Promise<AAModel[]> {
  console.log('🔄 Fetching data from Artificial Analysis...')

  try {
    // First try the curated data endpoint that AA maintains
    const curatedUrl = 'https://artificialanalysis.ai/api/models'
    const curatedResponse = await fetch(curatedUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AI-GO/1.0)'
      }
    }).catch(() => null)

    if (curatedResponse?.ok) {
      const data = await curatedResponse.json()
      if (data.models && Array.isArray(data.models)) {
        console.log(`✅ Fetched ${data.models.length} models from AA API`)
        return parseAAApiData(data.models)
      }
    }

    // Fallback to web scraping
    console.log('📄 Falling back to web scraping...')
    const pageUrl = 'https://artificialanalysis.ai/models'
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch AA page: ${response.status}`)
    }

    const html = await response.text()
    return scrapeAAModels(html)

  } catch (error) {
    console.error('❌ Failed to fetch AA data:', error)
    throw error
  }
}

/**
 * Parse API response data
 */
function parseAAApiData(models: any[]): AAModel[] {
  return models.map((model, index) => ({
    name: model.name || model.model_name,
    provider: model.organization || model.provider || inferProvider(model.name),
    intelligenceScore: parseFloat(model.quality_index || model.intelligence_score || 0),
    outputSpeed: parseFloat(model.tokens_per_second || model.output_speed || 0),
    inputPrice: parseFloat(model.price_per_million_input_tokens || model.input_price || 0),
    outputPrice: parseFloat(model.price_per_million_output_tokens || model.output_price || 0),
    contextWindow: parseInt(model.context_window || model.context_length || 0),
    rank: model.rank || index + 1
  })).filter(m => m.name && m.intelligenceScore > 0)
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
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
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
 * Main sync function
 */
async function syncAAData() {
  try {
    console.log('🚀 Starting AA data sync...')

    // Fetch real data
    const aaModels = await fetchAAData()

    if (aaModels.length === 0) {
      throw new Error('No models fetched from AA')
    }

    console.log(`\n📋 Fetched ${aaModels.length} models from AA`)
    console.log('Top 5 models:')
    aaModels.slice(0, 5).forEach(m => {
      console.log(`  - ${m.name}: Score=${m.intelligenceScore}, Speed=${m.outputSpeed}`)
    })

    // Sync to database
    const result = await syncToDatabase(aaModels)

    // Clear cache
    console.log('\n🗑️ Clearing cache...')
    // Note: In production, you'd clear Redis cache here

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

export { syncAAData, fetchAAData }
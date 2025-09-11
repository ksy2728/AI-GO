#!/usr/bin/env node

/**
 * Sync AA Models Script
 * Fetches latest models from Artificial Analysis and updates database
 */

const { PrismaClient } = require('@prisma/client')
const { getAAScraper, initializeAAScraper } = require('../src/services/aa-scraper')

const prisma = new PrismaClient()

// Model mapping for known AA models to internal slugs
const MODEL_MAPPING = {
  'GPT-4o': 'gpt-4o',
  'GPT-4o mini': 'gpt-4o-mini',
  'Claude 3.5 Sonnet': 'claude-3-5-sonnet',
  'Claude 3 Opus': 'claude-3-opus',
  'Claude 3 Haiku': 'claude-3-haiku',
  'Gemini 1.5 Flash': 'gemini-1-5-flash',
  'Gemini 1.5 Pro': 'gemini-1-5-pro',
  'Llama 3.1 405B': 'llama-3-1-405b',
  'Llama 3.1 70B': 'llama-3-1-70b',
  'Mistral Large': 'mistral-large',
  'o1-preview': 'o1-preview',
  'o1-mini': 'o1-mini',
}

async function syncAAModels() {
  console.log('🚀 Starting AA Models Sync...')
  
  try {
    // Initialize scraper
    initializeAAScraper()
    const scraper = getAAScraper()
    
    if (!scraper) {
      throw new Error('Failed to initialize AA scraper')
    }
    
    // Scrape latest models from AA
    console.log('📊 Fetching models from Artificial Analysis...')
    const aaModels = await scraper.scrapeModels()
    
    if (!aaModels || aaModels.length === 0) {
      console.warn('⚠️ No models fetched from AA')
      return
    }
    
    console.log(`✅ Fetched ${aaModels.length} models from AA`)
    
    // Update database with AA data
    let updatedCount = 0
    let createdCount = 0
    
    for (const aaModel of aaModels) {
      try {
        // Find matching model slug
        const modelSlug = MODEL_MAPPING[aaModel.name] || 
                         aaModel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        
        // Check if model exists
        const existingModel = await prisma.model.findUnique({
          where: { slug: modelSlug }
        })
        
        // Prepare AA metadata
        const aaMetadata = {
          intelligenceScore: aaModel.intelligenceScore || 0,
          outputSpeed: aaModel.outputSpeed || 0,
          price: aaModel.price || { input: 0, output: 0 },
          rank: aaModel.rank || 999,
          category: aaModel.category || 'general',
          isNew: aaModel.isNew || false,
          trend: aaModel.trend || 'stable',
          lastUpdated: new Date().toISOString(),
          provider: aaModel.provider,
          contextWindow: aaModel.contextWindow || 0,
          isActive: true
        }
        
        if (existingModel) {
          // Update existing model with AA data
          const currentMetadata = existingModel.metadata || {}
          
          await prisma.model.update({
            where: { slug: modelSlug },
            data: {
              metadata: {
                ...currentMetadata,
                aa: aaMetadata
              },
              updatedAt: new Date()
            }
          })
          
          updatedCount++
          console.log(`📝 Updated model: ${aaModel.name} (${modelSlug})`)
        } else {
          // Create new model with AA data
          const providerSlug = aaModel.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          
          // Find or create provider
          let provider = await prisma.provider.findUnique({
            where: { slug: providerSlug }
          })
          
          if (!provider) {
            provider = await prisma.provider.create({
              data: {
                slug: providerSlug,
                name: aaModel.provider,
                metadata: {}
              }
            })
            console.log(`🏢 Created provider: ${aaModel.provider}`)
          }
          
          // Create model
          await prisma.model.create({
            data: {
              slug: modelSlug,
              name: aaModel.name,
              providerId: provider.id,
              description: `${aaModel.name} - Intelligence: ${aaModel.intelligenceScore}, Speed: ${aaModel.outputSpeed} t/s`,
              modalities: ['text'],
              capabilities: ['reasoning', 'coding', 'analysis'],
              contextWindow: aaModel.contextWindow || 128000,
              isActive: true,
              metadata: {
                aa: aaMetadata
              }
            }
          })
          
          createdCount++
          console.log(`✨ Created model: ${aaModel.name} (${modelSlug})`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing model ${aaModel.name}:`, error.message)
      }
    }
    
    console.log(`
📊 Sync Summary:
- Models fetched: ${aaModels.length}
- Models updated: ${updatedCount}
- Models created: ${createdCount}
- Total processed: ${updatedCount + createdCount}
`)
    
    // Update system stats
    console.log('📈 Updating system statistics...')
    await updateSystemStats()
    
    console.log('✅ AA Models sync completed successfully!')
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function updateSystemStats() {
  try {
    // Count AA models
    const aaModelsCount = await prisma.model.count({
      where: {
        metadata: {
          path: ['aa'],
          not: null
        }
      }
    })
    
    console.log(`📊 Total AA models in database: ${aaModelsCount}`)
    
  } catch (error) {
    console.error('⚠️ Failed to update system stats:', error.message)
  }
}

// Run sync if called directly
if (require.main === module) {
  syncAAModels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { syncAAModels }
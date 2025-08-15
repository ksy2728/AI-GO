#!/usr/bin/env node

/**
 * Manual GitHub sync script
 * Usage: npm run sync:github
 */

require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  log: ['error'],
})

async function syncGitHub() {
  try {
    console.log('🚀 Starting GitHub data sync...')
    
    // Fetch data from local JSON file (for now)
    const modelsData = require('../data/models.json')
    
    console.log(`📊 Found ${modelsData.models.length} models in GitHub data`)
    
    let added = 0
    let updated = 0
    let errors = []
    
    // Process each model
    for (const model of modelsData.models) {
      try {
        // Ensure provider exists
        let provider = await prisma.providers.findFirst({
          where: { slug: model.provider.slug }
        })
        
        if (!provider) {
          provider = await prisma.providers.create({
            data: {
              id: model.provider.id || require('crypto').randomUUID(),
              name: model.provider.name,
              slug: model.provider.slug,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            }
          })
          console.log(`✅ Created provider: ${provider.name}`)
        }
        
        // Check if model exists
        const existingModel = await prisma.models.findFirst({
          where: { model_id: model.modelId }
        })
        
        if (!existingModel) {
          // Create new model
          await prisma.models.create({
            data: {
              id: model.id || require('crypto').randomUUID(),
              name: model.name,
              model_id: model.modelId,
              provider_id: provider.id,
              input_price: model.inputPrice || 0,
              output_price: model.outputPrice || 0,
              context_length: model.contextLength || 0,
              max_output: model.maxOutput || 0,
              modalities: model.modalities || [],
              capabilities: model.capabilities || [],
              release_date: model.releaseDate ? new Date(model.releaseDate) : new Date(),
              is_active: model.isActive !== false,
              description: model.description || null,
              created_at: new Date(),
              updated_at: new Date(),
            }
          })
          added++
          console.log(`➕ Added model: ${model.name}`)
        } else {
          // Update existing model
          await prisma.models.update({
            where: { id: existingModel.id },
            data: {
              name: model.name,
              input_price: model.inputPrice || 0,
              output_price: model.outputPrice || 0,
              context_length: model.contextLength || 0,
              max_output: model.maxOutput || 0,
              modalities: model.modalities || [],
              capabilities: model.capabilities || [],
              is_active: model.isActive !== false,
              description: model.description || null,
              updated_at: new Date(),
            }
          })
          updated++
          console.log(`🔄 Updated model: ${model.name}`)
        }
      } catch (modelError) {
        console.error(`❌ Error processing model ${model.name}:`, modelError.message)
        errors.push(`${model.name}: ${modelError.message}`)
      }
    }
    
    console.log('\n📊 Sync Summary:')
    console.log(`✅ Added: ${added} models`)
    console.log(`🔄 Updated: ${updated} models`)
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`)
      errors.forEach(err => console.log(`  - ${err}`))
    }
    
    // Get final counts
    const totalModels = await prisma.models.count()
    const activeModels = await prisma.models.count({
      where: { is_active: true }
    })
    
    console.log('\n📈 Database Status:')
    console.log(`Total models: ${totalModels}`)
    console.log(`Active models: ${activeModels}`)
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run sync
syncGitHub()
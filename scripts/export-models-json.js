/**
 * Export models to JSON file for manual upload
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportModels() {
  try {
    console.log('📊 Exporting models from database...')
    
    // Get all models
    const models = await prisma.model.findMany({
      include: {
        provider: true,
        status: true,
        pricing: true
      }
    })
    
    console.log(`Found ${models.length} models`)
    
    // Transform to simpler format
    const exportData = models.map(model => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      provider: model.provider.name,
      providerId: model.providerId,
      description: model.description,
      isActive: model.isActive,
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      capabilities: JSON.parse(model.capabilities || '[]'),
      modalities: JSON.parse(model.modalities || '[]'),
      pricing: model.pricing.length > 0 ? {
        inputPerMillion: model.pricing[0].inputPerMillion,
        outputPerMillion: model.pricing[0].outputPerMillion
      } : null
    }))
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'data', 'models-export.json')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2))
    
    console.log(`✅ Exported to ${outputPath}`)
    console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)
    
    // List all models
    console.log('\n📝 All models:')
    exportData.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.provider})`)
    })
    
  } catch (error) {
    console.error('❌ Export failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportModels()
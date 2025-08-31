import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Initialize model status records for all models that don't have status entries
 */
async function initializeModelStatus() {
  try {
    console.log('🔍 Checking for models without status records...')
    
    // Get all models
    const allModels = await prisma.model.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
      }
    })
    
    console.log(`📊 Found ${allModels.length} total models`)
    
    // Get models that already have status records
    const modelsWithStatus = await prisma.modelStatus.findMany({
      select: {
        modelId: true
      },
      distinct: ['modelId']
    })
    
    const modelIdsWithStatus = new Set(modelsWithStatus.map(m => m.modelId))
    
    // Find models without status
    const modelsWithoutStatus = allModels.filter(m => !modelIdsWithStatus.has(m.id))
    
    if (modelsWithoutStatus.length === 0) {
      console.log('✅ All models already have status records')
      return
    }
    
    console.log(`⚠️ Found ${modelsWithoutStatus.length} models without status records:`)
    modelsWithoutStatus.forEach(m => {
      console.log(`  - ${m.slug} (${m.name})`)
    })
    
    // Create status records for models without status
    console.log('\n📝 Creating status records...')
    
    const statusRecords = modelsWithoutStatus.map(model => ({
      modelId: model.id,
      status: 'unknown' as const,  // Start with 'unknown' instead of 'operational'
      availability: 0,              // 0% availability until first check
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      errorRate: 0,
      requestsPerMin: 0,
      tokensPerMin: 0,
      usage: 0,
      region: null,
      checkedAt: new Date()
    }))
    
    const result = await prisma.modelStatus.createMany({
      data: statusRecords,
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${result.count} new status records`)
    
    // Verify the count
    const totalStatusRecords = await prisma.modelStatus.groupBy({
      by: ['modelId'],
      _count: true
    }).then(results => results.length)
    
    console.log(`\n📊 Final statistics:`)
    console.log(`  - Total models: ${allModels.length}`)
    console.log(`  - Models with status: ${totalStatusRecords}`)
    console.log(`  - Coverage: ${((totalStatusRecords / allModels.length) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Error initializing model status:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  initializeModelStatus()
    .then(() => {
      console.log('\n✨ Model status initialization completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Model status initialization failed:', error)
      process.exit(1)
    })
}

export { initializeModelStatus }
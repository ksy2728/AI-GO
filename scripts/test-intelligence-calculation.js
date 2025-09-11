const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function calculateIntelligenceScore(benchmarkScores, metadata) {
  console.log('  calculateIntelligenceScore called with:')
  console.log('    benchmarkScores:', benchmarkScores?.length || 0)
  console.log('    metadata type:', typeof metadata)
  console.log('    metadata.aa exists:', !!metadata?.aa)
  console.log('    metadata.aa.intelligenceScore:', metadata?.aa?.intelligenceScore)
  console.log('    metadata.intelligenceScore:', metadata?.intelligenceScore)
  
  // Check for AA intelligence score first
  if (metadata?.aa?.intelligenceScore) {
    console.log('    -> Using AA intelligence score:', metadata.aa.intelligenceScore)
    return Number(metadata.aa.intelligenceScore)
  }
  if (metadata?.intelligenceScore) {
    console.log('    -> Using direct intelligence score:', metadata.intelligenceScore)
    return Number(metadata.intelligenceScore)
  }
  
  console.log('    -> No intelligence score found, returning 0')
  return 0
}

async function testIntelligenceCalculation() {
  try {
    const models = await prisma.model.findMany({
      take: 3,
      include: {
        benchmarkScores: true
      }
    })

    console.log('\n=== Testing Intelligence Calculation ===\n')
    
    for (const model of models) {
      console.log(`Model: ${model.name}`)
      
      // Parse metadata like the API does
      let parsedMetadata = null
      if (model.metadata && typeof model.metadata === 'string') {
        try {
          parsedMetadata = JSON.parse(model.metadata)
        } catch (e) {
          console.log('  Metadata parse error')
        }
      } else if (model.metadata) {
        parsedMetadata = model.metadata
      }
      
      // Test the calculation
      const score = calculateIntelligenceScore(model.benchmarkScores || [], parsedMetadata)
      console.log(`  Final score: ${score}`)
      console.log('')
    }

    // Now test with the exact transformation the API does
    console.log('\n=== Testing with API transformation ===\n')
    
    const transformedModels = models.map(model => {
      if (model.metadata && typeof model.metadata === 'string') {
        try {
          const parsed = JSON.parse(model.metadata)
          
          // Map AA data to top-level fields for chart functions
          if (parsed.aa) {
            return {
              ...model,
              metadata: parsed,
              intelligenceScore: parsed.aa.intelligenceScore,
              outputSpeed: parsed.aa.outputSpeed,
              aaPrice: parsed.aa.price,
              aaRank: parsed.aa.rank,
              aaCategory: parsed.aa.category,
              aaTrend: parsed.aa.trend
            }
          }
          
          return { ...model, metadata: parsed }
        } catch (e) {
          return model
        }
      }
      return model
    })
    
    for (const model of transformedModels) {
      console.log(`Model: ${model.name}`)
      const score = calculateIntelligenceScore(model.benchmarkScores || [], model.metadata || model)
      console.log(`  Score with (model.metadata || model): ${score}`)
      console.log('')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testIntelligenceCalculation()
const { PrismaClient } = require('@prisma/client')
const { getModelHighlights } = require('../src/lib/model-metrics')

const prisma = new PrismaClient()

async function testHighlightsAPI() {
  try {
    console.log('\n=== Testing Highlights API Logic ===\n')
    
    // Get models from database
    const models = await prisma.model.findMany({
      include: {
        provider: true,
        status: {
          take: 1,
          orderBy: { checkedAt: 'desc' }
        },
        benchmarkScores: {
          include: {
            suite: true
          },
          orderBy: { evaluationDate: 'desc' },
          take: 5
        },
        pricing: {
          where: {
            effectiveTo: null
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        }
      },
      take: 10
    })
    
    console.log(`Found ${models.length} models to test`)
    
    // Parse metadata like the API does
    const processedModels = models.map(model => {
      if (model.metadata && typeof model.metadata === 'string') {
        try {
          const parsed = JSON.parse(model.metadata)
          
          // Map AA data to top-level fields for chart functions
          if (parsed.aa) {
            const processed = {
              ...model,
              metadata: parsed,
              intelligenceScore: parsed.aa.intelligenceScore,
              outputSpeed: parsed.aa.outputSpeed,
              aaPrice: parsed.aa.price,
              aaRank: parsed.aa.rank,
              aaCategory: parsed.aa.category,
              aaTrend: parsed.aa.trend
            }
            
            console.log(`Model: ${model.name}`)
            console.log(`  - Has AA data: yes`)
            console.log(`  - intelligenceScore (top-level): ${processed.intelligenceScore}`)
            console.log(`  - metadata.aa.intelligenceScore: ${parsed.aa.intelligenceScore}`)
            console.log(`  - aaPrice (top-level): ${JSON.stringify(processed.aaPrice)}`)
            console.log('')
            
            return processed
          }
          
          return { ...model, metadata: parsed }
        } catch (e) {
          return model
        }
      }
      return model
    })
    
    // Test the highlights function
    console.log('\n=== Testing getModelHighlights Function ===\n')
    const highlights = getModelHighlights(processedModels)
    
    console.log('Results:')
    console.log(`  - Intelligence models: ${highlights.intelligence.length}`)
    if (highlights.intelligence.length > 0) {
      console.log('    Top 3:')
      highlights.intelligence.slice(0, 3).forEach(m => {
        console.log(`      ${m.modelName}: ${m.value}`)
      })
    }
    
    console.log(`  - Speed models: ${highlights.speed.length}`)
    if (highlights.speed.length > 0) {
      console.log('    Top 3:')
      highlights.speed.slice(0, 3).forEach(m => {
        console.log(`      ${m.modelName}: ${m.value}`)
      })
    }
    
    console.log(`  - Price models: ${highlights.price.length}`)
    if (highlights.price.length > 0) {
      console.log('    Top 3:')
      highlights.price.slice(0, 3).forEach(m => {
        console.log(`      ${m.modelName}: ${m.displayValue}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testHighlightsAPI()
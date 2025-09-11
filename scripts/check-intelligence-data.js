const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkIntelligenceData() {
  try {
    const models = await prisma.model.findMany({
      take: 10,
      include: {
        benchmarkScores: true
      }
    })

    console.log('\n=== Checking Intelligence Data ===\n')
    
    for (const model of models) {
      console.log(`Model: ${model.name}`)
      console.log(`  - ID: ${model.id}`)
      console.log(`  - BenchmarkScores count: ${model.benchmarkScores?.length || 0}`)
      
      // Check metadata
      let metadata = null
      if (model.metadata) {
        try {
          metadata = typeof model.metadata === 'string' 
            ? JSON.parse(model.metadata) 
            : model.metadata
        } catch (e) {
          console.log('  - Metadata parse error')
        }
      }
      
      if (metadata) {
        console.log(`  - Has metadata: yes`)
        console.log(`  - metadata.intelligenceScore: ${metadata.intelligenceScore || 'none'}`)
        console.log(`  - metadata.aa: ${metadata.aa ? 'yes' : 'no'}`)
        if (metadata.aa) {
          console.log(`    - aa.intelligenceScore: ${metadata.aa.intelligenceScore || 'none'}`)
          console.log(`    - aa.outputSpeed: ${metadata.aa.outputSpeed || 'none'}`)
          console.log(`    - aa.price: ${JSON.stringify(metadata.aa.price) || 'none'}`)
        }
      } else {
        console.log(`  - Has metadata: no`)
      }
      console.log('')
    }

    // Count models with intelligence scores
    const allModels = await prisma.model.findMany()
    let withIntelligence = 0
    let withAAData = 0
    let withBenchmarks = 0

    for (const model of allModels) {
      const benchmarks = await prisma.benchmarkScore.count({
        where: { modelId: model.id }
      })
      if (benchmarks > 0) withBenchmarks++

      if (model.metadata) {
        try {
          const metadata = typeof model.metadata === 'string' 
            ? JSON.parse(model.metadata) 
            : model.metadata
          
          if (metadata.intelligenceScore || (metadata.aa && metadata.aa.intelligenceScore)) {
            withIntelligence++
          }
          if (metadata.aa) {
            withAAData++
          }
        } catch (e) {}
      }
    }

    console.log('\n=== Summary ===')
    console.log(`Total models: ${allModels.length}`)
    console.log(`Models with intelligence score: ${withIntelligence}`)
    console.log(`Models with AA data: ${withAAData}`)
    console.log(`Models with benchmark scores: ${withBenchmarks}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkIntelligenceData()
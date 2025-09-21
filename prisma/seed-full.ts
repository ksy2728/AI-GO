import { PrismaClient } from '@prisma/client'
import fullModelsData from './seeds/models-full'

const prisma = new PrismaClient()

async function main() {
  // DISABLED: Full seed script disabled to use only AA-synchronized models
  // This maintains data quality by preventing static model data from interfering
  console.log('🚫 Full seed script is disabled. Using AA-synchronized models only.')
  console.log('ℹ️ If you need to re-enable, remove this return statement.')
  return

  console.log('🌱 Starting comprehensive seed...')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.modelStatus.deleteMany()
  await prisma.benchmarkScore.deleteMany()
  await prisma.pricing.deleteMany()
  await prisma.modelEndpoint.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.model.deleteMany()
  await prisma.benchmarkSuite.deleteMany()
  await prisma.provider.deleteMany()

  // Create Providers
  console.log('📦 Creating providers...')
  const providers = await Promise.all([
    prisma.provider.create({
      data: {
        slug: 'openai',
        name: 'OpenAI',
        websiteUrl: 'https://openai.com',
        documentationUrl: 'https://platform.openai.com/docs',
        statusPageUrl: 'https://status.openai.com',
        regions: JSON.stringify(['us-east-1', 'eu-west-1']),
        metadata: JSON.stringify({ established: 2015, type: 'commercial' }),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'anthropic',
        name: 'Anthropic',
        websiteUrl: 'https://anthropic.com',
        documentationUrl: 'https://docs.anthropic.com',
        statusPageUrl: 'https://status.anthropic.com',
        regions: JSON.stringify(['us-east-1', 'eu-west-1']),
        metadata: JSON.stringify({ established: 2021, type: 'commercial' }),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'google',
        name: 'Google AI',
        websiteUrl: 'https://ai.google',
        documentationUrl: 'https://ai.google.dev',
        statusPageUrl: 'https://status.cloud.google.com',
        regions: JSON.stringify(['us-central1', 'europe-west4', 'asia-northeast1']),
        metadata: JSON.stringify({ established: 2017, type: 'commercial' }),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'meta',
        name: 'Meta AI',
        websiteUrl: 'https://ai.meta.com',
        documentationUrl: 'https://llama.meta.com',
        regions: JSON.stringify(['global']),
        metadata: JSON.stringify({ established: 2013, type: 'open-source' }),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'microsoft',
        name: 'Microsoft',
        websiteUrl: 'https://microsoft.com/ai',
        documentationUrl: 'https://learn.microsoft.com/azure/ai-services',
        statusPageUrl: 'https://status.azure.com',
        regions: JSON.stringify(['us-east-1', 'eu-west-1', 'asia-east-1']),
        metadata: JSON.stringify({ established: 2016, type: 'commercial' }),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'mistral',
        name: 'Mistral AI',
        websiteUrl: 'https://mistral.ai',
        documentationUrl: 'https://docs.mistral.ai',
        regions: JSON.stringify(['eu-west-1']),
        metadata: JSON.stringify({ established: 2023, type: 'commercial' }),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'amazon',
        name: 'Amazon',
        websiteUrl: 'https://aws.amazon.com/bedrock',
        documentationUrl: 'https://docs.aws.amazon.com/bedrock',
        statusPageUrl: 'https://status.aws.amazon.com',
        regions: JSON.stringify(['us-east-1', 'us-west-2', 'eu-west-1']),
        metadata: JSON.stringify({ established: 2023, type: 'commercial' }),
      },
    }),
  ])

  // Create provider map
  const providerMap = providers.reduce((acc, provider) => {
    acc[provider.slug] = provider.id
    return acc
  }, {} as Record<string, string>)

  // Create Benchmark Suites
  console.log('📊 Creating benchmark suites...')
  const benchmarkSuites = await Promise.all([
    prisma.benchmarkSuite.create({
      data: {
        slug: 'mmlu',
        name: 'MMLU',
        description: 'Massive Multitask Language Understanding',
        category: 'knowledge',
        version: '1.0',
        evaluationType: 'accuracy',
        maxScore: 100,
        scoringMethod: 'percentage',
        metadata: JSON.stringify({ tasks: 57, subjects: 'diverse' }),
      },
    }),
    prisma.benchmarkSuite.create({
      data: {
        slug: 'humaneval',
        name: 'HumanEval',
        description: 'Code generation benchmark',
        category: 'coding',
        version: '1.0',
        evaluationType: 'pass@1',
        maxScore: 100,
        scoringMethod: 'percentage',
        metadata: JSON.stringify({ problems: 164, language: 'python' }),
      },
    }),
    prisma.benchmarkSuite.create({
      data: {
        slug: 'gsm8k',
        name: 'GSM8K',
        description: 'Grade School Math 8K',
        category: 'reasoning',
        version: '1.0',
        evaluationType: 'accuracy',
        maxScore: 100,
        scoringMethod: 'percentage',
        metadata: JSON.stringify({ problems: 8500 }),
      },
    }),
    prisma.benchmarkSuite.create({
      data: {
        slug: 'gpqa',
        name: 'GPQA',
        description: 'Graduate-level Google-proof Q&A',
        category: 'reasoning',
        version: '1.0',
        evaluationType: 'accuracy',
        maxScore: 100,
        scoringMethod: 'percentage',
        metadata: JSON.stringify({ difficulty: 'graduate' }),
      },
    }),
    prisma.benchmarkSuite.create({
      data: {
        slug: 'math',
        name: 'MATH',
        description: 'Competition mathematics problems',
        category: 'math',
        version: '1.0',
        evaluationType: 'accuracy',
        maxScore: 100,
        scoringMethod: 'percentage',
        metadata: JSON.stringify({ difficulty: 'competition' }),
      },
    }),
  ])

  const benchmarkMap = benchmarkSuites.reduce((acc, suite) => {
    acc[suite.slug] = suite.id
    return acc
  }, {} as Record<string, string>)

  // Process and create models from fullModelsData
  console.log('🤖 Creating AI models...')
  let modelCount = 0
  
  for (const [providerSlug, models] of Object.entries(fullModelsData)) {
    const providerId = providerMap[providerSlug]
    if (!providerId) {
      console.warn(`⚠️ Provider ${providerSlug} not found, skipping models`)
      continue
    }

    for (const modelData of models) {
      try {
        // Create the model
        const model = await prisma.model.create({
          data: {
            providerId,
            slug: modelData.slug,
            name: modelData.name,
            description: modelData.description,
            foundationModel: modelData.foundationModel,
            releasedAt: modelData.releasedAt,
            modalities: JSON.stringify(modelData.modalities || []),
            capabilities: JSON.stringify(modelData.capabilities || []),
            contextWindow: modelData.contextWindow,
            maxOutputTokens: modelData.maxOutputTokens,
            trainingCutoff: (modelData as any).trainingCutoff || null,
            apiVersion: (modelData as any).apiVersion || null,
            isActive: true,
            metadata: JSON.stringify((modelData as any).metadata || {}),
          },
        })

        // Create pricing if available
        if ((modelData as any).pricing) {
          const pricing = (modelData as any).pricing
          await prisma.pricing.create({
            data: {
              modelId: model.id,
              tier: 'standard',
              region: 'us-east-1',
              currency: 'USD',
              inputPerMillion: pricing.input || pricing.input_128k || 0,
              outputPerMillion: pricing.output || pricing.output_128k || 0,
              imagePerUnit: pricing.standard || pricing.hd || 0,
              audioPerMinute: pricing.minute || pricing.character || 0,
              volumeDiscounts: JSON.stringify({}),
              effectiveFrom: new Date(),
              metadata: JSON.stringify(pricing),
            },
          })
        }

        // Create benchmark scores if available
        if ((modelData as any).benchmarks) {
          for (const [benchmarkSlug, score] of Object.entries((modelData as any).benchmarks)) {
            const benchmarkId = benchmarkMap[benchmarkSlug]
            if (benchmarkId && typeof score === 'number') {
              await prisma.benchmarkScore.create({
                data: {
                  modelId: model.id,
                  suiteId: benchmarkId,
                  scoreRaw: score,
                  scoreNormalized: score / 100,
                  percentile: 0, // Calculate later
                  evaluationDate: new Date(),
                  isOfficial: true,
                  configuration: JSON.stringify({}),
                },
              })
            }
          }
        }

        // Create initial model status
        await prisma.modelStatus.create({
          data: {
            modelId: model.id,
            status: 'operational',
            availability: 99.9,
            latencyP50: Math.random() * 100 + 50,
            latencyP95: Math.random() * 200 + 100,
            latencyP99: Math.random() * 300 + 150,
            errorRate: Math.random() * 0.1,
            requestsPerMin: Math.floor(Math.random() * 10000),
            tokensPerMin: Math.floor(Math.random() * 1000000),
            usage: Math.random() * 100,
            region: 'us-east-1',
            checkedAt: new Date(),
          },
        })

        modelCount++
        console.log(`  ✅ Created ${modelData.name}`)
      } catch (error) {
        console.error(`  ❌ Failed to create ${modelData.name}:`, error)
      }
    }
  }

  console.log(`\n✨ Seed completed successfully!`)
  console.log(`📊 Summary:`)
  console.log(`  - Providers: ${providers.length}`)
  console.log(`  - Models: ${modelCount}`)
  console.log(`  - Benchmark Suites: ${benchmarkSuites.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
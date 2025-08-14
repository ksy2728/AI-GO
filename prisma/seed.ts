import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  await prisma.modelStatus.deleteMany()
  await prisma.benchmarkScore.deleteMany()
  await prisma.pricing.deleteMany()
  await prisma.modelEndpoint.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.model.deleteMany()
  await prisma.benchmarkSuite.deleteMany()
  await prisma.provider.deleteMany()

  // Create Providers
  const providers = await Promise.all([
    prisma.provider.create({
      data: {
        slug: 'openai',
        name: 'OpenAI',
        websiteUrl: 'https://openai.com',
        documentationUrl: 'https://platform.openai.com/docs',
        regions: JSON.stringify(['us-east-1', 'eu-west-1']),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'anthropic',
        name: 'Anthropic',
        websiteUrl: 'https://anthropic.com',
        documentationUrl: 'https://docs.anthropic.com',
        regions: JSON.stringify(['us-east-1']),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'google',
        name: 'Google AI',
        websiteUrl: 'https://ai.google',
        documentationUrl: 'https://ai.google.dev',
        regions: JSON.stringify(['us-central1', 'europe-west4', 'asia-northeast1']),
      },
    }),
    prisma.provider.create({
      data: {
        slug: 'meta',
        name: 'Meta AI',
        websiteUrl: 'https://ai.meta.com',
        documentationUrl: 'https://ai.meta.com/llama',
        regions: JSON.stringify(['global']),
      },
    }),
  ])

  console.log(`✅ Created ${providers.length} providers`)

  // Create Models
  const models = await Promise.all([
    // OpenAI Models
    prisma.model.create({
      data: {
        providerId: providers[0].id,
        slug: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Latest GPT-4 model with improved performance and lower costs',
        foundationModel: 'GPT-4',
        releasedAt: new Date('2024-04-09'),
        modalities: JSON.stringify(['text', 'image']),
        capabilities: JSON.stringify(['reasoning', 'coding', 'analysis']),
        contextWindow: 128000,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2024-04-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),
    prisma.model.create({
      data: {
        providerId: providers[0].id,
        slug: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Optimized GPT-4 for faster responses',
        foundationModel: 'GPT-4',
        releasedAt: new Date('2024-05-13'),
        modalities: JSON.stringify(['text', 'image', 'audio']),
        capabilities: JSON.stringify(['reasoning', 'coding', 'vision', 'audio']),
        contextWindow: 128000,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2024-10-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),
    prisma.model.create({
      data: {
        providerId: providers[0].id,
        slug: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective model for simpler tasks',
        foundationModel: 'GPT-3.5',
        releasedAt: new Date('2022-11-30'),
        modalities: JSON.stringify(['text']),
        capabilities: JSON.stringify(['coding', 'conversation']),
        contextWindow: 16385,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2021-09-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),

    // Anthropic Models
    prisma.model.create({
      data: {
        providerId: providers[1].id,
        slug: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most capable Claude model for complex tasks',
        foundationModel: 'Claude 3',
        releasedAt: new Date('2024-03-04'),
        modalities: JSON.stringify(['text', 'image']),
        capabilities: JSON.stringify(['reasoning', 'analysis', 'writing', 'vision']),
        contextWindow: 200000,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2024-08-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),
    prisma.model.create({
      data: {
        providerId: providers[1].id,
        slug: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and intelligence',
        foundationModel: 'Claude 3',
        releasedAt: new Date('2024-03-04'),
        modalities: JSON.stringify(['text', 'image']),
        capabilities: JSON.stringify(['reasoning', 'analysis', 'writing', 'vision']),
        contextWindow: 200000,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2024-08-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),
    prisma.model.create({
      data: {
        providerId: providers[1].id,
        slug: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fast and compact model for instant responses',
        foundationModel: 'Claude 3',
        releasedAt: new Date('2024-03-07'),
        modalities: JSON.stringify(['text', 'image']),
        capabilities: JSON.stringify(['conversation', 'analysis', 'vision']),
        contextWindow: 200000,
        maxOutputTokens: 4096,
        trainingCutoff: new Date('2024-08-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),

    // Google Models
    prisma.model.create({
      data: {
        providerId: providers[2].id,
        slug: 'gemini-ultra',
        name: 'Gemini Ultra',
        description: 'Most capable multimodal AI model from Google',
        foundationModel: 'Gemini',
        releasedAt: new Date('2024-02-08'),
        modalities: JSON.stringify(['text', 'image', 'audio', 'video']),
        capabilities: JSON.stringify(['reasoning', 'multimodal', 'coding']),
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        trainingCutoff: new Date('2024-01-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),
    prisma.model.create({
      data: {
        providerId: providers[2].id,
        slug: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Balanced performance for general tasks',
        foundationModel: 'Gemini',
        releasedAt: new Date('2023-12-13'),
        modalities: JSON.stringify(['text', 'image']),
        capabilities: JSON.stringify(['reasoning', 'coding', 'vision']),
        contextWindow: 32768,
        maxOutputTokens: 2048,
        trainingCutoff: new Date('2023-11-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),

    // Meta Models
    prisma.model.create({
      data: {
        providerId: providers[3].id,
        slug: 'llama-3-70b',
        name: 'Llama 3 70B',
        description: 'Open-source large language model',
        foundationModel: 'Llama 3',
        releasedAt: new Date('2024-04-18'),
        modalities: JSON.stringify(['text']),
        capabilities: JSON.stringify(['reasoning', 'coding', 'conversation']),
        contextWindow: 8192,
        maxOutputTokens: 2048,
        trainingCutoff: new Date('2023-12-01'),
        apiVersion: 'v1',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${models.length} models`)

  // Create Benchmark Suites
  const benchmarkSuites = await Promise.all([
    prisma.benchmarkSuite.create({
      data: {
        slug: 'mmlu',
        name: 'MMLU',
        description: 'Massive Multitask Language Understanding',
        category: 'knowledge',
        maxScore: 100,
        scoringMethod: 'percentage',
      },
    }),
    prisma.benchmarkSuite.create({
      data: {
        slug: 'humaneval',
        name: 'HumanEval',
        description: 'Code generation benchmark',
        category: 'coding',
        maxScore: 100,
        scoringMethod: 'percentage',
      },
    }),
    prisma.benchmarkSuite.create({
      data: {
        slug: 'gsm8k',
        name: 'GSM8K',
        description: 'Grade School Math 8K',
        category: 'reasoning',
        maxScore: 100,
        scoringMethod: 'percentage',
      },
    }),
  ])

  console.log(`✅ Created ${benchmarkSuites.length} benchmark suites`)

  // Create Sample Benchmark Scores
  const benchmarkScores = await Promise.all([
    // GPT-4 Turbo scores
    prisma.benchmarkScore.create({
      data: {
        modelId: models[0].id,
        suiteId: benchmarkSuites[0].id, // MMLU
        scoreRaw: 86.4,
        scoreNormalized: 86.4,
        percentile: 99,
        evaluationDate: new Date('2024-04-15'),
        isOfficial: true,
      },
    }),
    prisma.benchmarkScore.create({
      data: {
        modelId: models[0].id,
        suiteId: benchmarkSuites[1].id, // HumanEval
        scoreRaw: 85.2,
        scoreNormalized: 85.2,
        percentile: 98,
        evaluationDate: new Date('2024-04-15'),
        isOfficial: true,
      },
    }),

    // Claude 3 Opus scores
    prisma.benchmarkScore.create({
      data: {
        modelId: models[3].id,
        suiteId: benchmarkSuites[0].id, // MMLU
        scoreRaw: 86.8,
        scoreNormalized: 86.8,
        percentile: 99,
        evaluationDate: new Date('2024-03-10'),
        isOfficial: true,
      },
    }),
    prisma.benchmarkScore.create({
      data: {
        modelId: models[3].id,
        suiteId: benchmarkSuites[1].id, // HumanEval
        scoreRaw: 84.9,
        scoreNormalized: 84.9,
        percentile: 97,
        evaluationDate: new Date('2024-03-10'),
        isOfficial: true,
      },
    }),

    // Gemini Ultra scores
    prisma.benchmarkScore.create({
      data: {
        modelId: models[6].id,
        suiteId: benchmarkSuites[0].id, // MMLU
        scoreRaw: 90.0,
        scoreNormalized: 90.0,
        percentile: 100,
        evaluationDate: new Date('2024-02-15'),
        isOfficial: true,
      },
    }),
  ])

  console.log(`✅ Created ${benchmarkScores.length} benchmark scores`)

  // Create Model Status entries
  const modelStatuses = await Promise.all(
    models.map((model) =>
      prisma.modelStatus.create({
        data: {
          modelId: model.id,
          status: 'operational',
          availability: 99.5 + Math.random() * 0.5,
          latencyP50: 80 + Math.floor(Math.random() * 40),
          latencyP95: 150 + Math.floor(Math.random() * 100),
          latencyP99: 300 + Math.floor(Math.random() * 200),
          errorRate: Math.random() * 0.5,
          requestsPerMin: Math.floor(Math.random() * 10000),
          tokensPerMin: Math.floor(Math.random() * 1000000),
          usage: Math.random() * 100,
        },
      })
    )
  )

  console.log(`✅ Created ${modelStatuses.length} model status entries`)

  // Create Pricing entries
  const pricingEntries = await Promise.all([
    // GPT-4 Turbo pricing
    prisma.pricing.create({
      data: {
        modelId: models[0].id,
        tier: 'standard',
        currency: 'USD',
        inputPerMillion: 10,
        outputPerMillion: 30,
        effectiveFrom: new Date('2024-04-09'),
      },
    }),
    // GPT-3.5 Turbo pricing
    prisma.pricing.create({
      data: {
        modelId: models[2].id,
        tier: 'standard',
        currency: 'USD',
        inputPerMillion: 0.5,
        outputPerMillion: 1.5,
        effectiveFrom: new Date('2024-01-01'),
      },
    }),
    // Claude 3 Opus pricing
    prisma.pricing.create({
      data: {
        modelId: models[3].id,
        tier: 'standard',
        currency: 'USD',
        inputPerMillion: 15,
        outputPerMillion: 75,
        effectiveFrom: new Date('2024-03-04'),
      },
    }),
    // Claude 3 Haiku pricing
    prisma.pricing.create({
      data: {
        modelId: models[5].id,
        tier: 'standard',
        currency: 'USD',
        inputPerMillion: 0.25,
        outputPerMillion: 1.25,
        effectiveFrom: new Date('2024-03-07'),
      },
    }),
  ])

  console.log(`✅ Created ${pricingEntries.length} pricing entries`)

  console.log('✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
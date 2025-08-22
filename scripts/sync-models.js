const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises
const path = require('path')

const prisma = new PrismaClient()

// 모델 데이터 동기화
async function syncModels() {
  try {
    console.log('🔄 Starting model sync...')
    
    // 기존 모델 수 확인
    const beforeCount = await prisma.model.count()
    console.log(`📊 Current models in database: ${beforeCount}`)
    
    // 기본 Provider 생성/확인
    const providers = [
      { id: 'openai', slug: 'openai', name: 'OpenAI', websiteUrl: 'https://openai.com' },
      { id: 'anthropic', slug: 'anthropic', name: 'Anthropic', websiteUrl: 'https://anthropic.com' },
      { id: 'google', slug: 'google', name: 'Google', websiteUrl: 'https://ai.google' },
      { id: 'meta', slug: 'meta', name: 'Meta', websiteUrl: 'https://ai.meta.com' },
      { id: 'microsoft', slug: 'microsoft', name: 'Microsoft', websiteUrl: 'https://azure.microsoft.com' },
      { id: 'amazon', slug: 'amazon', name: 'Amazon', websiteUrl: 'https://aws.amazon.com' },
      { id: 'cohere', slug: 'cohere', name: 'Cohere', websiteUrl: 'https://cohere.ai' },
      { id: 'mistral', slug: 'mistral', name: 'Mistral AI', websiteUrl: 'https://mistral.ai' },
      { id: 'huggingface', slug: 'huggingface', name: 'Hugging Face', websiteUrl: 'https://huggingface.co' },
      { id: 'replicate', slug: 'replicate', name: 'Replicate', websiteUrl: 'https://replicate.com' }
    ]
    
    // Provider 생성/업데이트
    for (const provider of providers) {
      await prisma.provider.upsert({
        where: { slug: provider.slug },
        update: provider,
        create: provider
      })
    }
    console.log('✅ Providers synchronized')
    
    // 모델 데이터 생성/업데이트 (기존 데이터와 호환되도록 간단한 형식 사용)
    const modelsToUpdate = [
      // OpenAI Models
      { slug: 'gpt-4o', name: 'GPT-4o', providerId: 'openai' },
      { slug: 'gpt-4o-mini', name: 'GPT-4o Mini', providerId: 'openai' },
      { slug: 'gpt-4-turbo', name: 'GPT-4 Turbo', providerId: 'openai' },
      { slug: 'gpt-4', name: 'GPT-4', providerId: 'openai' },
      { slug: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', providerId: 'openai' },
      { slug: 'dall-e-3', name: 'DALL-E 3', providerId: 'openai' },
      { slug: 'whisper-1', name: 'Whisper', providerId: 'openai' },
      
      // Anthropic Models
      { slug: 'claude-3-opus', name: 'Claude 3 Opus', providerId: 'anthropic' },
      { slug: 'claude-3-sonnet', name: 'Claude 3 Sonnet', providerId: 'anthropic' },
      { slug: 'claude-3-haiku', name: 'Claude 3 Haiku', providerId: 'anthropic' },
      { slug: 'claude-2.1', name: 'Claude 2.1', providerId: 'anthropic' },
      { slug: 'claude-instant', name: 'Claude Instant', providerId: 'anthropic' },
      
      // Google Models
      { slug: 'gemini-ultra', name: 'Gemini Ultra', providerId: 'google' },
      { slug: 'gemini-pro', name: 'Gemini Pro', providerId: 'google' },
      { slug: 'gemini-nano', name: 'Gemini Nano', providerId: 'google' },
      { slug: 'palm-2', name: 'PaLM 2', providerId: 'google' },
      { slug: 'bard', name: 'Bard', providerId: 'google' },
      
      // Meta Models
      { slug: 'llama-2-70b', name: 'Llama 2 70B', providerId: 'meta' },
      { slug: 'llama-2-13b', name: 'Llama 2 13B', providerId: 'meta' },
      { slug: 'llama-2-7b', name: 'Llama 2 7B', providerId: 'meta' },
      { slug: 'code-llama', name: 'Code Llama', providerId: 'meta' },
      
      // Microsoft Models
      { slug: 'phi-2', name: 'Phi-2', providerId: 'microsoft' },
      { slug: 'bing-chat', name: 'Bing Chat', providerId: 'microsoft' },
      
      // Mistral Models
      { slug: 'mistral-large', name: 'Mistral Large', providerId: 'mistral' },
      { slug: 'mistral-medium', name: 'Mistral Medium', providerId: 'mistral' },
      { slug: 'mistral-small', name: 'Mistral Small', providerId: 'mistral' },
      { slug: 'mixtral-8x7b', name: 'Mixtral 8x7B', providerId: 'mistral' },
      
      // Cohere Models
      { slug: 'command-r-plus', name: 'Command R+', providerId: 'cohere' },
      { slug: 'command-r', name: 'Command R', providerId: 'cohere' },
      { slug: 'command', name: 'Command', providerId: 'cohere' },
      
      // Amazon Models
      { slug: 'titan-text', name: 'Titan Text', providerId: 'amazon' },
      { slug: 'titan-embeddings', name: 'Titan Embeddings', providerId: 'amazon' }
    ]
    
    // 모델 생성/업데이트
    for (const modelData of modelsToUpdate) {
      try {
        await prisma.model.upsert({
          where: { slug: modelData.slug },
          update: {
            name: modelData.name,
            providerId: modelData.providerId,
            isActive: true
          },
          create: {
            slug: modelData.slug,
            name: modelData.name,
            providerId: modelData.providerId,
            isActive: true,
            modalities: JSON.stringify(['text']),
            capabilities: JSON.stringify(['generation'])
          }
        })
      } catch (error) {
        console.error(`⚠️ Failed to upsert model ${modelData.slug}:`, error.message)
      }
    }
    console.log(`✅ ${modelsToUpdate.length} models synchronized`)
    
    // 모델 상태 업데이트만 수행 (기존 모델들의 상태만 갱신)
    // 5분 주기이므로 매번 다른 모델들을 업데이트하여 부하 분산
    const totalModels = await prisma.model.count()
    const currentMinute = new Date().getMinutes()
    const batchSize = Math.min(15, Math.ceil(totalModels / 4)) // 4번에 나눠서 모든 모델 업데이트
    const offset = (currentMinute % 4) * batchSize
    
    console.log(`🔄 Updating models batch ${Math.floor(currentMinute / 5) % 4 + 1}/4 (offset: ${offset}, size: ${batchSize})`)
    
    const existingModels = await prisma.model.findMany({
      include: {
        status: true
      },
      skip: offset,
      take: batchSize
    })
    
    for (const model of existingModels) {
      // 실시간 상태 시뮬레이션
      let randomStatus = 'operational'
      const random = Math.random() * 100
      if (random > 85 && random <= 98) {
        randomStatus = 'degraded'
      } else if (random > 98) {
        randomStatus = 'outage'
      }
      
      // ModelStatus 업데이트/생성 (기본 리전 사용)
      const region = 'global'
      await prisma.modelStatus.upsert({
        where: { 
          modelId_region: {
            modelId: model.id,
            region: region
          }
        },
        update: {
          status: randomStatus,
          availability: randomStatus === 'outage' ? Math.random() * 30 + 70 : Math.random() * 5 + 95,
          latencyP50: Math.floor(Math.random() * 200) + 50,
          errorRate: randomStatus === 'outage' ? Math.random() * 10 : Math.random() * 2,
          checkedAt: new Date()
        },
        create: {
          modelId: model.id,
          region: region,
          status: randomStatus,
          availability: randomStatus === 'outage' ? Math.random() * 30 + 70 : Math.random() * 5 + 95,
          latencyP50: Math.floor(Math.random() * 200) + 50,
          errorRate: randomStatus === 'outage' ? Math.random() * 10 : Math.random() * 2,
          checkedAt: new Date()
        }
      })
    }
    
    const afterCount = await prisma.model.count()
    console.log(`✅ Model batch sync completed. Updated ${existingModels.length} models. Total models: ${afterCount}`)
    
    // 통계 업데이트
    const activeModels = await prisma.model.count({
      where: { isActive: true }
    })
    
    const operationalCount = await prisma.modelStatus.count({
      where: { status: 'operational' }
    })
    
    const degradedCount = await prisma.modelStatus.count({
      where: { status: 'degraded' }
    })
    
    const outageCount = await prisma.modelStatus.count({
      where: { status: 'outage' }
    })
    
    const avgAvailability = await prisma.modelStatus.aggregate({
      _avg: { availability: true }
    })
    
    console.log(`📊 Statistics:`)
    console.log(`   - Active models: ${activeModels}`)
    console.log(`   - Operational: ${operationalCount}`)
    console.log(`   - Degraded: ${degradedCount}`)
    console.log(`   - Outage: ${outageCount}`)
    console.log(`   - Average availability: ${avgAvailability._avg.availability?.toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트가 직접 실행될 때
if (require.main === module) {
  syncModels()
    .then(() => {
      console.log('🎉 Sync completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Sync failed:', error)
      process.exit(1)
    })
}

module.exports = { syncModels }
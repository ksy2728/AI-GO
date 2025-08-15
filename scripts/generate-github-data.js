/**
 * Generate GitHub data in the correct format
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function generateGitHubData() {
  try {
    console.log('📊 Generating GitHub data format...')
    
    // Get all models with relations
    const models = await prisma.model.findMany({
      include: {
        provider: true,
        status: true,
        pricing: true
      }
    })
    
    // Get all providers
    const providers = await prisma.provider.findMany()
    
    console.log(`Found ${models.length} models and ${providers.length} providers`)
    
    // Transform models to GitHub format
    const transformedModels = models.map(model => ({
      id: model.id,
      slug: model.slug,
      name: model.name,
      description: model.description,
      provider: {
        id: model.provider.slug,
        name: model.provider.name,
        slug: model.provider.slug,
        websiteUrl: model.provider.websiteUrl,
        documentationUrl: model.provider.documentationUrl
      },
      foundationModel: model.foundationModel,
      releasedAt: model.releasedAt?.toISOString(),
      deprecatedAt: model.deprecatedAt?.toISOString(),
      sunsetAt: model.sunsetAt?.toISOString(),
      modalities: JSON.parse(model.modalities || '[]'),
      capabilities: JSON.parse(model.capabilities || '[]'),
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      trainingCutoff: model.trainingCutoff?.toISOString(),
      apiVersion: model.apiVersion,
      isActive: model.isActive,
      status: model.status[0] ? {
        status: model.status[0].status,
        availability: model.status[0].availability,
        latencyP50: model.status[0].latencyP50,
        latencyP95: model.status[0].latencyP95,
        latencyP99: model.status[0].latencyP99,
        errorRate: model.status[0].errorRate,
        requestsPerMin: model.status[0].requestsPerMin,
        tokensPerMin: model.status[0].tokensPerMin,
        usage: model.status[0].usage,
        checkedAt: model.status[0].checkedAt.toISOString()
      } : {
        status: 'operational',
        availability: 99.9,
        latencyP50: 100,
        latencyP95: 200,
        latencyP99: 500,
        errorRate: 0.1,
        requestsPerMin: 0,
        tokensPerMin: 0,
        usage: 0,
        checkedAt: new Date().toISOString()
      },
      benchmarks: [],
      pricing: model.pricing[0] ? {
        tier: model.pricing[0].tier,
        currency: model.pricing[0].currency,
        inputPerMillion: model.pricing[0].inputPerMillion,
        outputPerMillion: model.pricing[0].outputPerMillion,
        imagePerUnit: model.pricing[0].imagePerUnit,
        audioPerMinute: model.pricing[0].audioPerMinute,
        videoPerMinute: model.pricing[0].videoPerMinute,
        effectiveFrom: model.pricing[0].effectiveFrom.toISOString()
      } : null
    }))
    
    // Transform providers
    const transformedProviders = providers.map(p => ({
      id: p.slug,
      name: p.name,
      slug: p.slug,
      websiteUrl: p.websiteUrl,
      documentationUrl: p.documentationUrl
    }))
    
    // Calculate statistics
    const activeModels = models.filter(m => m.isActive).length
    const operationalModels = models.filter(m => m.status[0]?.status === 'operational').length
    const avgAvailability = models.reduce((sum, m) => sum + (m.status[0]?.availability || 99.9), 0) / models.length
    
    // Create the complete data structure
    const githubData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      providers: transformedProviders,
      models: transformedModels,
      benchmarkSuites: [],
      statistics: {
        totalModels: models.length,
        activeModels: activeModels,
        totalProviders: providers.length,
        operationalModels: operationalModels,
        avgAvailability: Math.round(avgAvailability * 10) / 10
      }
    }
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'data', 'models.json')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(githubData, null, 2))
    
    console.log(`✅ Generated GitHub data format`)
    console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)
    console.log(`📊 Statistics:`)
    console.log(`   - Total models: ${githubData.statistics.totalModels}`)
    console.log(`   - Active models: ${githubData.statistics.activeModels}`)
    console.log(`   - Total providers: ${githubData.statistics.totalProviders}`)
    console.log(`   - Avg availability: ${githubData.statistics.avgAvailability}%`)
    
    // Also create status file
    const statusData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      statuses: {}
    }
    
    models.forEach(model => {
      if (model.status[0]) {
        statusData.statuses[model.slug] = {
          status: model.status[0].status,
          availability: model.status[0].availability,
          latencyP50: model.status[0].latencyP50,
          latencyP95: model.status[0].latencyP95,
          latencyP99: model.status[0].latencyP99,
          errorRate: model.status[0].errorRate,
          requestsPerMin: model.status[0].requestsPerMin,
          tokensPerMin: model.status[0].tokensPerMin,
          usage: model.status[0].usage,
          checkedAt: model.status[0].checkedAt.toISOString()
        }
      }
    })
    
    const statusPath = path.join(process.cwd(), 'data', 'model-status.json')
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2))
    console.log(`✅ Generated model-status.json`)
    
  } catch (error) {
    console.error('❌ Generation failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateGitHubData()
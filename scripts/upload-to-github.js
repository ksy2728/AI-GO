/**
 * Upload local database data to GitHub
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { Octokit } = require('@octokit/rest')
const path = require('path')

const prisma = new PrismaClient()
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

const OWNER = process.env.GITHUB_OWNER || 'ksy2728'
const REPO = process.env.GITHUB_REPO || 'AI-GO'

async function uploadToGitHub() {
  try {
    console.log('🚀 Starting data upload to GitHub...')

    // Get all models from database
    const models = await prisma.model.findMany({
      include: {
        provider: true,
        status: true,
        pricing: true,
        benchmarkScores: true
      }
    })

    console.log(`📊 Found ${models.length} models in database`)

    // Transform to GitHub format
    const githubData = models.map(model => ({
      id: model.id,
      providerId: model.providerId,
      slug: model.slug,
      name: model.name,
      description: model.description,
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
      metadata: JSON.parse(model.metadata || '{}'),
      provider: {
        id: model.provider.id,
        slug: model.provider.slug,
        name: model.provider.name,
        logoUrl: model.provider.logoUrl,
        websiteUrl: model.provider.websiteUrl,
        statusPageUrl: model.provider.statusPageUrl,
        documentationUrl: model.provider.documentationUrl
      },
      status: model.status[0] ? {
        status: model.status[0].status,
        availability: model.status[0].availability,
        latencyP50: model.status[0].latencyP50,
        latencyP95: model.status[0].latencyP95,
        latencyP99: model.status[0].latencyP99,
        errorRate: model.status[0].errorRate,
        requestsPerMin: model.status[0].requestsPerMin,
        tokensPerMin: model.status[0].tokensPerMin,
        usage: model.status[0].usage
      } : null,
      pricing: model.pricing.map(p => ({
        tier: p.tier,
        region: p.region,
        currency: p.currency,
        inputPerMillion: p.inputPerMillion,
        outputPerMillion: p.outputPerMillion,
        imagePerUnit: p.imagePerUnit,
        audioPerMinute: p.audioPerMinute,
        videoPerMinute: p.videoPerMinute,
        fineTuningPerMillion: p.fineTuningPerMillion
      }))
    }))

    // Create JSON content
    const content = JSON.stringify(githubData, null, 2)
    const encodedContent = Buffer.from(content).toString('base64')

    // Get current file (if exists)
    let sha
    try {
      const { data: currentFile } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: 'data/models.json'
      })
      sha = currentFile.sha
      console.log('📝 Updating existing file...')
    } catch (error) {
      console.log('📝 Creating new file...')
    }

    // Update or create file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: 'data/models.json',
      message: `🔄 Update models data from local database (${models.length} models)`,
      content: encodedContent,
      sha: sha
    })

    console.log('✅ Successfully uploaded to GitHub!')
    console.log(`📍 File URL: ${response.data.content.html_url}`)

    // Also update providers
    const providers = await prisma.provider.findMany()
    const providersContent = JSON.stringify(providers.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      logoUrl: p.logoUrl,
      websiteUrl: p.websiteUrl,
      statusPageUrl: p.statusPageUrl,
      documentationUrl: p.documentationUrl,
      regions: JSON.parse(p.regions || '[]'),
      metadata: JSON.parse(p.metadata || '{}')
    })), null, 2)

    try {
      const { data: currentProviders } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: 'data/providers.json'
      })
      sha = currentProviders.sha
    } catch (error) {
      sha = undefined
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: 'data/providers.json',
      message: `🔄 Update providers data from local database`,
      content: Buffer.from(providersContent).toString('base64'),
      sha: sha
    })

    console.log('✅ Providers uploaded successfully!')

  } catch (error) {
    console.error('❌ Upload failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

uploadToGitHub()
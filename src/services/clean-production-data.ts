#!/usr/bin/env tsx
/**
 * Production Database Cleanup Script
 * Removes test data and prepares for real AA data
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

// Test data patterns to identify and remove
const TEST_MODEL_PATTERNS = [
  'GPT-5',
  'gpt-oss',
  'Grok 3 mini Reasoning',
  'test',
  'demo',
  'example',
  'simulation'
]

async function cleanTestData() {
  console.log('🧹 Starting production database cleanup...')

  try {
    // 1. Identify test models
    const testModels = await prisma.model.findMany({
      where: {
        OR: TEST_MODEL_PATTERNS.map(pattern => ({
          OR: [
            { name: { contains: pattern, mode: 'insensitive' } },
            { slug: { contains: pattern, mode: 'insensitive' } }
          ]
        }))
      }
    })

    console.log(`📋 Found ${testModels.length} test models to remove`)

    if (testModels.length > 0) {
      const modelIds = testModels.map(m => m.id)

      // 2. Delete related data first (due to foreign key constraints)
      console.log('Deleting model status records...')
      const statusDeleted = await prisma.modelStatus.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      console.log(`  ✅ Deleted ${statusDeleted.count} status records`)

      console.log('Deleting benchmark scores...')
      const benchmarksDeleted = await prisma.benchmarkScore.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      console.log(`  ✅ Deleted ${benchmarksDeleted.count} benchmark scores`)

      console.log('Deleting pricing records...')
      const pricingDeleted = await prisma.pricing.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      console.log(`  ✅ Deleted ${pricingDeleted.count} pricing records`)

      console.log('Deleting endpoints...')
      const endpointsDeleted = await prisma.modelEndpoint.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      console.log(`  ✅ Deleted ${endpointsDeleted.count} endpoints`)

      console.log('Deleting incidents...')
      const incidentsDeleted = await prisma.incident.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      console.log(`  ✅ Deleted ${incidentsDeleted.count} incidents`)

      // 3. Delete the test models themselves
      console.log('Deleting test models...')
      const modelsDeleted = await prisma.model.deleteMany({
        where: { id: { in: modelIds } }
      })
      console.log(`  ✅ Deleted ${modelsDeleted.count} test models`)
    }

    // 4. Clean up models with obviously fake intelligence scores
    const suspiciousModels = await prisma.model.findMany({
      where: {
        metadata: {
          path: '$.intelligenceScore',
          gte: 100
        }
      }
    })

    if (suspiciousModels.length > 0) {
      console.log(`⚠️ Found ${suspiciousModels.length} models with suspicious scores (>100)`)
      for (const model of suspiciousModels) {
        await prisma.model.update({
          where: { id: model.id },
          data: {
            metadata: JSON.stringify({
              ...(typeof model.metadata === 'object' ? model.metadata : {}),
              needsSync: true,
              lastCleaned: new Date().toISOString()
            })
          }
        })
      }
    }

    // 5. Mark remaining models for re-sync
    const remainingModels = await prisma.model.findMany()
    console.log(`📊 ${remainingModels.length} models remaining in database`)

    // Mark all for re-sync with AA
    const updatePromises = remainingModels.map(model =>
      prisma.model.update({
        where: { id: model.id },
        data: {
          metadata: JSON.stringify({
            ...(typeof model.metadata === 'object' ? model.metadata : {}),
            needsAASync: true,
            cleanupDate: new Date().toISOString()
          })
        }
      })
    )

    await Promise.all(updatePromises)
    console.log('✅ Marked all remaining models for AA re-sync')

    // 6. Summary
    const summary = {
      testModelsRemoved: testModels.length,
      remainingModels: remainingModels.length,
      timestamp: new Date().toISOString()
    }

    console.log('\n📈 Cleanup Summary:')
    console.log(JSON.stringify(summary, null, 2))

    return summary

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  cleanTestData()
    .then(() => {
      console.log('\n✨ Cleanup completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error)
      process.exit(1)
    })
}

export { cleanTestData }
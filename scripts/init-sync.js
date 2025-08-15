/**
 * Initial sync script to populate database with real data from APIs
 * Run this on application startup or deployment
 */

require('dotenv').config({ path: '.env.local' })

async function initSync() {
  console.log('🚀 Starting initial data sync...')
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
  
  const providers = ['openai', 'anthropic', 'google', 'meta']
  const results = {
    success: [],
    failed: []
  }
  
  for (const provider of providers) {
    try {
      console.log(`📡 Syncing ${provider}...`)
      
      const response = await fetch(`${baseUrl}/api/v1/sync/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${provider}: ${data.result?.modelsUpdated || 0} models synced`)
        results.success.push({
          provider,
          models: data.result?.modelsUpdated || 0
        })
      } else {
        console.warn(`⚠️ ${provider}: Failed with status ${response.status}`)
        results.failed.push({
          provider,
          error: `HTTP ${response.status}`
        })
      }
    } catch (error) {
      console.error(`❌ ${provider}: ${error.message}`)
      results.failed.push({
        provider,
        error: error.message
      })
    }
    
    // Add delay between providers to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Summary
  console.log('\n📊 Sync Summary:')
  console.log(`✅ Successful: ${results.success.length} providers`)
  results.success.forEach(r => {
    console.log(`  - ${r.provider}: ${r.models} models`)
  })
  
  if (results.failed.length > 0) {
    console.log(`⚠️ Failed: ${results.failed.length} providers`)
    results.failed.forEach(r => {
      console.log(`  - ${r.provider}: ${r.error}`)
    })
  }
  
  const totalModels = results.success.reduce((sum, r) => sum + r.models, 0)
  console.log(`\n🎯 Total models synced: ${totalModels}`)
  
  return results
}

// Run if called directly
if (require.main === module) {
  initSync()
    .then(results => {
      if (results.failed.length === 0) {
        console.log('\n✨ Initial sync completed successfully!')
        process.exit(0)
      } else {
        console.log('\n⚠️ Initial sync completed with some failures')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n❌ Initial sync failed:', error)
      process.exit(1)
    })
}

module.exports = { initSync }
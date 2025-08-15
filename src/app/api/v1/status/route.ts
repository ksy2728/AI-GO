import { NextResponse } from 'next/server'
import { StatusService } from '@/services/status.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    // Check if we're in production environment (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        process.env.VERCEL_ENV !== undefined

    if (detailed) {
      // Return detailed status with provider breakdown and incidents
      let detailedStatus
      let dataSource = 'github'
      
      if (isProduction) {
        // In production, use GitHub as primary data source
        try {
          const systemStats = await GitHubDataService.getSystemStats()
          const data = await GitHubDataService.getAllData()
          
          // Get provider summary from GitHub data
          const providers = data.providers.map(provider => {
            const providerModels = data.models.filter(m => m.provider.slug === provider.slug)
            const operational = providerModels.filter(m => m.status?.status === 'operational').length
            const total = providerModels.length
            
            return {
              id: provider.id,
              name: provider.name,
              slug: provider.slug,
              operationalModels: operational,
              totalModels: total,
              availability: total > 0 ? Math.round((operational / total) * 100) : 0
            }
          })
          
          detailedStatus = {
            system: systemStats,
            providers,
            recentIncidents: [] // GitHub data doesn't include incidents yet
          }
          console.log('📦 Using GitHub data source for detailed status (production)')
        } catch (githubError) {
          console.warn('⚠️ GitHub data failed, using temporary data:', githubError instanceof Error ? githubError.message : 'Unknown error')
          const systemStats = await TempDataService.getSystemStats()
          detailedStatus = {
            system: systemStats,
            providers: await TempDataService.getProvidersSummary(),
            recentIncidents: []
          }
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source for detailed status')
        }
      } else {
        // In development, try database first
        try {
          detailedStatus = await StatusService.getDetailedStatus()
          dataSource = 'database'
          console.log('🗄️ Using database source for detailed status (development)')
        } catch (dbError) {
          console.warn('⚠️ Database failed, trying GitHub data:', dbError instanceof Error ? dbError.message : 'Unknown error')
          
          try {
            const systemStats = await GitHubDataService.getSystemStats()
            const data = await GitHubDataService.getAllData()
            
            // Get provider summary from GitHub data
            const providers = data.providers.map(provider => {
              const providerModels = data.models.filter(m => m.provider.slug === provider.slug)
              const operational = providerModels.filter(m => m.status?.status === 'operational').length
              const total = providerModels.length
              
              return {
                id: provider.id,
                name: provider.name,
                slug: provider.slug,
                operationalModels: operational,
                totalModels: total,
                availability: total > 0 ? Math.round((operational / total) * 100) : 0
              }
            })
            
            detailedStatus = {
              system: systemStats,
              providers,
              recentIncidents: [] // GitHub data doesn't include incidents yet
            }
            dataSource = 'github'
            console.log('📦 Using GitHub data source for detailed status')
          } catch (githubError) {
            console.warn('⚠️ GitHub data failed, using temporary data:', githubError instanceof Error ? githubError.message : 'Unknown error')
            const systemStats = await TempDataService.getSystemStats()
            detailedStatus = {
              system: systemStats,
              providers: await TempDataService.getProvidersSummary(),
              recentIncidents: []
            }
            dataSource = 'temp-data'
            console.log('📝 Using temporary data source for detailed status')
          }
        }
      }
      
      return NextResponse.json({
        ...detailedStatus,
        timestamp: new Date().toISOString(),
        dataSource,
        cached: dataSource === 'github'
      })
    } else {
      // Return basic system stats only
      let systemStats
      let dataSource = 'github'
      
      if (isProduction) {
        // In production, use GitHub as primary data source
        try {
          systemStats = await GitHubDataService.getSystemStats()
          console.log('📦 Using GitHub data source for system stats (production)')
        } catch (githubError) {
          console.warn('⚠️ GitHub data failed, using temporary data:', githubError instanceof Error ? githubError.message : 'Unknown error')
          systemStats = await TempDataService.getSystemStats()
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source for system stats')
        }
      } else {
        // In development, try database first
        try {
          systemStats = await StatusService.getSystemStats()
          dataSource = 'database'
          console.log('🗄️ Using database source for system stats (development)')
        } catch (dbError) {
          console.warn('⚠️ Database failed, trying GitHub data:', dbError instanceof Error ? dbError.message : 'Unknown error')
          
          try {
            systemStats = await GitHubDataService.getSystemStats()
            dataSource = 'github'
            console.log('📦 Using GitHub data source for system stats')
          } catch (githubError) {
            console.warn('⚠️ GitHub data failed, using temporary data:', githubError instanceof Error ? githubError.message : 'Unknown error')
            systemStats = await TempDataService.getSystemStats()
            dataSource = 'temp-data'
            console.log('📝 Using temporary data source for system stats')
          }
        }
      }
      
      return NextResponse.json({
        ...systemStats,
        timestamp: new Date().toISOString(),
        dataSource,
        cached: dataSource === 'github'
      })
    }
  } catch (error) {
    console.error('❌ Error in status API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch system status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
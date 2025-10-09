import { NextResponse } from 'next/server'
import { StatusService } from '@/services/status.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    // Determine preferred data source (defaults to GitHub)
    const preferredDataSource = process.env.DATA_SOURCE || 'github'

    if (detailed) {
      // Return detailed status with provider breakdown and incidents
      let detailedStatus
      let dataSource = 'temp-data'
      
      // Try preferred data source first
      if (preferredDataSource === 'database') {
        try {
          detailedStatus = await StatusService.getDetailedStatus()
          dataSource = 'database'
          console.log('🐘 Using database source for detailed status (preferred)')
        } catch (dbError) {
          console.warn('⚠️ Database failed, trying GitHub:', dbError instanceof Error ? dbError.message : 'Unknown error')
          
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
              recentIncidents: []
            }
            dataSource = 'github'
            console.log('📦 Using GitHub data source (database fallback)')
          } catch (githubError) {
            console.warn('⚠️ GitHub failed, using temp data:', githubError instanceof Error ? githubError.message : 'Unknown error')
            const systemStats = await TempDataService.getSystemStats()
            detailedStatus = {
              system: systemStats,
              providers: await TempDataService.getProvidersSummary(),
              recentIncidents: []
            }
            dataSource = 'temp-data'
            console.log('📝 Using temporary data source (final fallback)')
          }
        }
      } else if (preferredDataSource === 'github') {
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
            recentIncidents: []
          }
          dataSource = 'github'
          console.log('📦 Using GitHub data source (preferred)')
        } catch (githubError) {
          console.warn('⚠️ GitHub failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
          
          try {
            detailedStatus = await StatusService.getDetailedStatus()
            dataSource = 'database'
            console.log('🐘 Using database source (github fallback)')
          } catch (dbError) {
            console.warn('⚠️ Database failed, using temp data:', dbError instanceof Error ? dbError.message : 'Unknown error')
            const systemStats = await TempDataService.getSystemStats()
            detailedStatus = {
              system: systemStats,
              providers: await TempDataService.getProvidersSummary(),
              recentIncidents: []
            }
            dataSource = 'temp-data'
            console.log('📝 Using temporary data source (final fallback)')
          }
        }
      } else {
        // Default: temp-data (original behavior)
        try {
          const systemStats = await TempDataService.getSystemStats()
          detailedStatus = {
            system: systemStats,
            providers: await TempDataService.getProvidersSummary(),
            recentIncidents: []
          }
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source (preferred)')
        } catch (tempDataError) {
          console.warn('⚠️ TempData failed, trying GitHub:', tempDataError instanceof Error ? tempDataError.message : 'Unknown error')
          
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
              recentIncidents: []
            }
            dataSource = 'github'
            console.log('📦 Using GitHub data source (temp-data fallback)')
          } catch (githubError) {
            console.warn('⚠️ GitHub failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
            
            try {
              detailedStatus = await StatusService.getDetailedStatus()
              dataSource = 'database'
              console.log('🐘 Using database source (final fallback)')
            } catch (dbError) {
              console.error('💥 All data sources failed for detailed status:', dbError)
              throw new Error('All data sources are unavailable')
            }
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
      let dataSource = 'temp-data'
      
      // Try preferred data source first
      if (preferredDataSource === 'database') {
        try {
          systemStats = await StatusService.getSystemStats()
          dataSource = 'database'
          console.log('🐘 Using database source for system stats (preferred)')
        } catch (dbError) {
          console.warn('⚠️ Database failed, trying GitHub:', dbError instanceof Error ? dbError.message : 'Unknown error')
          
          try {
            systemStats = await GitHubDataService.getSystemStats()
            dataSource = 'github'
            console.log('📦 Using GitHub data source (database fallback)')
          } catch (githubError) {
            console.warn('⚠️ GitHub failed, using temp data:', githubError instanceof Error ? githubError.message : 'Unknown error')
            systemStats = await TempDataService.getSystemStats()
            dataSource = 'temp-data'
            console.log('📝 Using temporary data source (final fallback)')
          }
        }
      } else if (preferredDataSource === 'github') {
        try {
          systemStats = await GitHubDataService.getSystemStats()
          dataSource = 'github'
          console.log('📦 Using GitHub data source (preferred)')
        } catch (githubError) {
          console.warn('⚠️ GitHub failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
          
          try {
            systemStats = await StatusService.getSystemStats()
            dataSource = 'database'
            console.log('🐘 Using database source (github fallback)')
          } catch (dbError) {
            console.warn('⚠️ Database failed, using temp data:', dbError instanceof Error ? dbError.message : 'Unknown error')
            systemStats = await TempDataService.getSystemStats()
            dataSource = 'temp-data'
            console.log('📝 Using temporary data source (final fallback)')
          }
        }
      } else {
        // Default: temp-data (original behavior)
        try {
          systemStats = await TempDataService.getSystemStats()
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source (preferred)')
        } catch (tempDataError) {
          console.warn('⚠️ TempData failed, trying GitHub:', tempDataError instanceof Error ? tempDataError.message : 'Unknown error')
          
          try {
            systemStats = await GitHubDataService.getSystemStats()
            dataSource = 'github'
            console.log('📦 Using GitHub data source (temp-data fallback)')
          } catch (githubError) {
            console.warn('⚠️ GitHub failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
            
            try {
              systemStats = await StatusService.getSystemStats()
              dataSource = 'database'
              console.log('🐘 Using database source (final fallback)')
            } catch (dbError) {
              console.error('💥 All data sources failed for system stats:', dbError)
              throw new Error('All data sources are unavailable')
            }
          }
        }
      }
      
      return NextResponse.json({
        ...systemStats,
        timestamp: new Date().toISOString(),
        dataSource,
        cached: dataSource === 'github',
        env: {
          dataSourcePreference: process.env.DATA_SOURCE || 'not-set',
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasDirectUrl: !!process.env.DIRECT_URL,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV || 'not-set'
        }
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
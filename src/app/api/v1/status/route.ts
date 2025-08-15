import { NextResponse } from 'next/server'
import { StatusService } from '@/services/status.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'

    if (detailed) {
      // Return detailed status with provider breakdown and incidents
      let detailedStatus
      let dataSource = 'github'
      
      try {
        // Try GitHub data first (preferred for consistency)
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
        console.log('📦 Using GitHub data source for detailed status')
      } catch (githubError) {
        console.warn('⚠️ GitHub data failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
        
        try {
          detailedStatus = await StatusService.getDetailedStatus()
          dataSource = 'database'
          console.log('🗄️ Using database source for detailed status')
        } catch (dbError) {
          console.warn('⚠️ Database failed, using temporary data:', dbError instanceof Error ? dbError.message : 'Unknown error')
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
      
      try {
        // Try GitHub data first (preferred for consistency)
        systemStats = await GitHubDataService.getSystemStats()
        console.log('📦 Using GitHub data source for system stats')
      } catch (githubError) {
        console.warn('⚠️ GitHub data failed, trying database:', githubError instanceof Error ? githubError.message : 'Unknown error')
        
        try {
          systemStats = await StatusService.getSystemStats()
          dataSource = 'database'
          console.log('🗄️ Using database source for system stats')
        } catch (dbError) {
          console.warn('⚠️ Database failed, using temporary data:', dbError instanceof Error ? dbError.message : 'Unknown error')
          systemStats = await TempDataService.getSystemStats()
          dataSource = 'temp-data'
          console.log('📝 Using temporary data source for system stats')
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
import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

// Disable caching for this route
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Model slug is required' },
        { status: 400 }
      )
    }

    // Check if we're in production environment (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' || 
                        process.env.VERCEL_ENV !== undefined

    let model
    
    if (isProduction) {
      // In production, use GitHub as primary data source
      try {
        model = await GitHubDataService.getModelBySlug(slug)
        console.log('📦 Using GitHub data source for model details (production)')
      } catch (githubError) {
        console.warn('⚠️ GitHub data failed, using temporary data:', githubError instanceof Error ? githubError.message : 'Unknown error')
        model = await TempDataService.getModelBySlug(slug)
      }
    } else {
      // In development, try database first
      try {
        model = await ModelService.getBySlug(slug)
        console.log('🗄️ Using database for model details (development)')
      } catch (error) {
        console.warn('⚠️ Database service failed, trying GitHub:', error instanceof Error ? error.message : 'Unknown error')
        try {
          model = await GitHubDataService.getModelBySlug(slug)
          console.log('📦 Using GitHub data source for model details (fallback)')
        } catch (githubError) {
          console.warn('⚠️ GitHub data failed, using temporary data:', githubError instanceof Error ? githubError.message : 'Unknown error')
          model = await TempDataService.getModelBySlug(slug)
        }
      }
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      model,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error fetching model details:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch model details',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
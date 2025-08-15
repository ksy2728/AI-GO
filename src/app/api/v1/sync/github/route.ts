import { NextRequest, NextResponse } from 'next/server'
import { GitHubSyncService } from '@/services/github-sync.service'

/**
 * Manual GitHub sync endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check if sync is already in progress
    const status = GitHubSyncService.getSyncStatus()
    if (status.inProgress) {
      return NextResponse.json({
        success: false,
        message: 'Sync already in progress',
        status,
      }, { status: 409 })
    }
    
    console.log('🚀 Manual GitHub sync initiated')
    
    // Perform sync
    const result = await GitHubSyncService.forceSync()
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('❌ Sync error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Get sync status
 */
export async function GET() {
  const status = GitHubSyncService.getSyncStatus()
  
  return NextResponse.json({
    ...status,
    timestamp: new Date().toISOString(),
  })
}
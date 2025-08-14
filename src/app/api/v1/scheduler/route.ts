import { NextResponse } from 'next/server'
import { syncScheduler } from '@/services/scheduler/sync-scheduler'

// Initialize scheduler on first load
let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await syncScheduler.initialize()
    syncScheduler.startAll()
    initialized = true
    console.log('✅ Scheduler initialized and started')
  }
}

export async function GET() {
  try {
    await ensureInitialized()
    
    const status = syncScheduler.getStatus()
    
    return NextResponse.json({
      initialized: true,
      tasks: status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error getting scheduler status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get scheduler status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await ensureInitialized()
    
    const body = await request.json()
    const { action, taskName } = body

    switch (action) {
      case 'start':
        if (taskName) {
          syncScheduler.startTask(taskName)
        } else {
          syncScheduler.startAll()
        }
        break
      
      case 'stop':
        if (taskName) {
          syncScheduler.stopTask(taskName)
        } else {
          syncScheduler.stopAll()
        }
        break
      
      case 'status':
        const status = syncScheduler.getStatus()
        return NextResponse.json({
          tasks: status,
          timestamp: new Date().toISOString(),
        })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use start, stop, or status' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      taskName,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error managing scheduler:', error)
    return NextResponse.json(
      { 
        error: 'Failed to manage scheduler',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
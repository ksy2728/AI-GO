import { NextRequest, NextResponse } from 'next/server'
import { GitHubSyncService } from '@/services/github-sync.service'
import crypto from 'crypto'

/**
 * Verify GitHub webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = `sha256=${hmac.digest('hex')}`
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Handle GitHub webhook for automatic sync
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || ''
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')
    
    // Get raw body for signature verification
    const body = await request.text()
    
    // Verify webhook signature if secret is configured
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.warn('⚠️ Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    const payload = JSON.parse(body)
    
    console.log(`📨 Received GitHub webhook: ${event}`)
    
    // Handle push events to main branch
    if (event === 'push' && payload.ref === 'refs/heads/main') {
      // Check if data files were modified
      const modifiedFiles = payload.commits?.reduce((files: string[], commit: any) => {
        return files.concat(commit.modified || [], commit.added || [])
      }, []) || []
      
      const dataFilesModified = modifiedFiles.some((file: string) => 
        file.startsWith('data/') && file.endsWith('.json')
      )
      
      if (dataFilesModified) {
        console.log('📊 Data files modified, triggering sync...')
        
        // Trigger async sync (don't wait for completion)
        GitHubSyncService.forceSync().then(result => {
          console.log('✅ Webhook-triggered sync completed:', result.message)
        }).catch(error => {
          console.error('❌ Webhook-triggered sync failed:', error)
        })
        
        return NextResponse.json({
          message: 'Sync triggered',
          event,
          files: modifiedFiles,
        })
      }
    }
    
    // Handle manual sync request (repository_dispatch event)
    if (event === 'repository_dispatch' && payload.action === 'sync_models') {
      console.log('🔄 Manual sync requested via repository dispatch')
      
      GitHubSyncService.forceSync().then(result => {
        console.log('✅ Manual sync completed:', result.message)
      }).catch(error => {
        console.error('❌ Manual sync failed:', error)
      })
      
      return NextResponse.json({
        message: 'Manual sync triggered',
        event,
        action: payload.action,
      })
    }
    
    return NextResponse.json({
      message: 'Webhook received',
      event,
      processed: false,
    })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get webhook configuration status
 */
export async function GET() {
  const status = GitHubSyncService.getSyncStatus()
  
  return NextResponse.json({
    webhook: {
      enabled: !!process.env.GITHUB_WEBHOOK_SECRET,
      endpoint: '/api/v1/webhook/github',
      events: ['push', 'repository_dispatch'],
    },
    sync: status,
    timestamp: new Date().toISOString(),
  })
}
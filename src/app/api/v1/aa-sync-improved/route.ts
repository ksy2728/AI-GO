import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { improvedAASyncScheduler } from '@/services/aa-sync-improved';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(_request: NextRequest) {
  try {
    // TODO: Enforce authentication once admin flow is finalized

    console.log('📡 AA Improved Sync API triggered');

    // Trigger the sync
    const result = await improvedAASyncScheduler.triggerSync();

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Successfully synced ${result.modelsCount} models with ${result.modelsUpdated} updates`
        : 'Sync failed',
      details: {
        modelsCount: result.modelsCount,
        modelsUpdated: result.modelsUpdated,
        pricingUpdated: result.pricingUpdated,
        duration: `${result.duration}ms`,
        dataQuality: result.dataQuality,
        errors: result.errors,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('❌ AA Improved Sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get sync status
    const status = improvedAASyncScheduler.getSyncStatus();

    return NextResponse.json({
      isSyncing: status.isSyncing,
      lastSync: status.lastSync,
      nextSyncIn: status.nextSyncIn ? `${Math.round(status.nextSyncIn / 1000)}s` : null,
      history: status.history
    });
  } catch (error) {
    console.error('❌ AA Improved Sync status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
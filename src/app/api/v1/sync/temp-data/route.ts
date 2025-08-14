import { NextResponse } from 'next/server';
import { ApiSyncService } from '@/services/api-sync.service';
import { logger } from '@/utils/logger';

export async function POST(request: Request) {
  try {
    logger.info('🚀 Starting TempDataService sync with APIs...');
    
    const apiSyncService = new ApiSyncService();
    
    // 모든 API에서 최신 데이터 수집
    const syncedModels = await apiSyncService.syncAllModels();
    
    // TempDataService 파일 업데이트
    await apiSyncService.updateTempDataService(syncedModels);
    
    logger.info(`✅ Successfully synced ${syncedModels.length} models to TempDataService`);
    
    return NextResponse.json({
      success: true,
      message: 'TempDataService successfully synced with APIs',
      totalModels: syncedModels.length,
      modelsByProvider: {
        openai: syncedModels.filter(m => m.provider.slug === 'openai').length,
        anthropic: syncedModels.filter(m => m.provider.slug === 'anthropic').length,
        google: syncedModels.filter(m => m.provider.slug === 'google').length,
        meta: syncedModels.filter(m => m.provider.slug === 'meta').length,
      },
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Error during TempDataService sync:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync TempDataService with APIs',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    
    logger.info(dryRun ? '🔍 Dry run: Checking API sync status...' : '📊 Getting sync status...');
    
    const apiSyncService = new ApiSyncService();
    
    if (dryRun) {
      // Dry run - 실제로 파일을 업데이트하지 않고 수집만 함
      const syncedModels = await apiSyncService.syncAllModels();
      
      return NextResponse.json({
        dryRun: true,
        totalModelsAvailable: syncedModels.length,
        modelsByProvider: {
          openai: syncedModels.filter(m => m.provider.slug === 'openai').length,
          anthropic: syncedModels.filter(m => m.provider.slug === 'anthropic').length,
          google: syncedModels.filter(m => m.provider.slug === 'google').length,
          meta: syncedModels.filter(m => m.provider.slug === 'meta').length,
        },
        apiKeysConfigured: {
          openai: !!process.env.OPENAI_API_KEY,
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          google: !!process.env.GOOGLE_AI_API_KEY,
          replicate: !!process.env.REPLICATE_API_TOKEN,
        },
        sampleModels: syncedModels.slice(0, 3).map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider.name,
          pricing: m.pricing,
        })),
      });
    }
    
    // 현재 TempDataService 상태 조회
    const { TempDataService } = await import('@/services/temp-data.service');
    const currentStats = await TempDataService.getSystemStats();
    
    return NextResponse.json({
      currentTempDataStats: currentStats,
      lastChecked: new Date().toISOString(),
      syncEndpoint: '/api/v1/sync/temp-data (POST)',
      dryRunEndpoint: '/api/v1/sync/temp-data?dryRun=true (GET)',
    });
  } catch (error) {
    logger.error('❌ Error getting sync status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
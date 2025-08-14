/**
 * Vercel Cron Job for TempDataService Sync
 * 매일 자동으로 API 동기화 실행
 */

import { NextResponse } from 'next/server';
import { ApiSyncService } from '@/services/api-sync.service';
import { logger } from '@/utils/logger';

export async function GET(request: Request) {
  try {
    // Vercel Cron 인증 확인 (선택적)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('🚫 Unauthorized cron job access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('⏰ Cron job started: TempDataService sync');
    
    const startTime = Date.now();
    const apiSyncService = new ApiSyncService();
    
    // API 동기화 실행
    const syncedModels = await apiSyncService.syncAllModels();
    await apiSyncService.updateTempDataService(syncedModels);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const result = {
      success: true,
      message: 'TempDataService sync completed successfully',
      duration: `${duration}ms`,
      totalModels: syncedModels.length,
      modelsByProvider: {
        openai: syncedModels.filter(m => m.provider.slug === 'openai').length,
        anthropic: syncedModels.filter(m => m.provider.slug === 'anthropic').length,
        google: syncedModels.filter(m => m.provider.slug === 'google').length,
        meta: syncedModels.filter(m => m.provider.slug === 'meta').length,
      },
      timestamp: new Date().toISOString(),
    };

    logger.info(`✅ Cron job completed in ${duration}ms`);
    logger.info(`📊 Synced ${syncedModels.length} models total`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Cron job failed:', errorMessage);
    
    const errorResult = {
      success: false,
      error: 'Cron job failed',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(errorResult, { status: 500 });
  }
}

// POST 메서드도 지원 (수동 트리거용)
export async function POST(request: Request) {
  return GET(request);
}
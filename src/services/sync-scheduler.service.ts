/**
 * Sync Scheduler Service - 정기 동기화 스케줄러
 * Vercel Cron Jobs 또는 Node.js 환경에서 정기적으로 API 동기화 실행
 */

import { ApiSyncService } from '@/services/api-sync.service';
import { logger } from '@/utils/logger';

export class SyncSchedulerService {
  private apiSyncService: ApiSyncService;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.apiSyncService = new ApiSyncService();
  }

  /**
   * 정기 동기화 시작
   */
  startPeriodicSync(intervalHours: number = 24): void {
    logger.info(`📅 Starting periodic sync every ${intervalHours} hours`);

    // 즉시 한 번 실행
    this.executeSyncSafely();

    // 정기 실행 스케줄링
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const intervalId = setInterval(() => {
      this.executeSyncSafely();
    }, intervalMs);

    this.intervals.set('main', intervalId);
    logger.info(`✅ Periodic sync scheduled with interval ID: ${intervalId}`);
  }

  /**
   * 정기 동기화 중지
   */
  stopPeriodicSync(): void {
    this.intervals.forEach((intervalId, key) => {
      clearInterval(intervalId);
      logger.info(`🛑 Stopped interval: ${key}`);
    });
    this.intervals.clear();
    logger.info('✅ All periodic sync intervals stopped');
  }

  /**
   * 안전한 동기화 실행 (에러 처리 포함)
   */
  private async executeSyncSafely(): Promise<void> {
    try {
      logger.info('🔄 Executing scheduled API sync...');
      
      const startTime = Date.now();
      const syncedModels = await this.apiSyncService.syncAllModels();
      await this.apiSyncService.updateTempDataService(syncedModels);
      const endTime = Date.now();
      
      logger.info(`✅ Scheduled sync completed successfully in ${endTime - startTime}ms`);
      logger.info(`📊 Synced ${syncedModels.length} models total`);
      
      // 성공 통계 로깅
      const stats = this.generateSyncStats(syncedModels);
      logger.info('📈 Sync Statistics:', stats);
      
    } catch (error) {
      logger.error('❌ Scheduled sync failed:', error);
      
      // 에러를 로깅하지만 스케줄러는 계속 실행
      // 운영 환경에서는 여기에 알림 시스템 연동 가능
      this.handleSyncError(error);
    }
  }

  /**
   * 동기화 통계 생성
   */
  private generateSyncStats(models: any[]) {
    const stats = {
      totalModels: models.length,
      byProvider: {} as Record<string, number>,
      avgPricing: {
        input: 0,
        output: 0,
      },
      capabilities: {} as Record<string, number>,
    };

    models.forEach(model => {
      // 제공업체별 통계
      const provider = model.provider.slug;
      stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;

      // 가격 통계
      stats.avgPricing.input += model.pricing.inputPerMillion;
      stats.avgPricing.output += model.pricing.outputPerMillion;

      // 능력별 통계
      model.capabilities.forEach((capability: string) => {
        stats.capabilities[capability] = (stats.capabilities[capability] || 0) + 1;
      });
    });

    // 평균 계산
    if (models.length > 0) {
      stats.avgPricing.input /= models.length;
      stats.avgPricing.output /= models.length;
    }

    return stats;
  }

  /**
   * 동기화 에러 처리
   */
  private handleSyncError(error: any): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };

    logger.error('🚨 Sync Error Details:', errorInfo);

    // 여기에 추가 에러 처리 로직 구현 가능:
    // - Slack/Discord 알림
    // - 이메일 알림  
    // - Sentry/DataDog 같은 모니터링 시스템 연동
    // - 데이터베이스에 에러 로그 저장
  }

  /**
   * 수동 동기화 실행
   */
  async executeManualSync(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('🚀 Executing manual sync...');
      
      const syncedModels = await this.apiSyncService.syncAllModels();
      await this.apiSyncService.updateTempDataService(syncedModels);
      
      const result = {
        success: true,
        data: {
          totalModels: syncedModels.length,
          stats: this.generateSyncStats(syncedModels),
          timestamp: new Date().toISOString(),
        },
      };

      logger.info('✅ Manual sync completed successfully');
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Manual sync failed:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 현재 스케줄러 상태 조회
   */
  getSchedulerStatus() {
    return {
      activeIntervals: this.intervals.size,
      intervals: Array.from(this.intervals.keys()),
      isRunning: this.intervals.size > 0,
      lastChecked: new Date().toISOString(),
    };
  }
}

// 싱글톤 인스턴스 (선택적)
export const syncScheduler = new SyncSchedulerService();
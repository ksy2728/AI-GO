import { dataAggregator } from '../src/services/data-aggregator.service';
import { logger } from '../src/utils/logger';

async function main() {
  try {
    logger.info('Starting data aggregation script...');

    const forceUpdate = process.env.FORCE_UPDATE === 'true';

    if (forceUpdate) {
      logger.info('Force update enabled - clearing cache...');
      // Clear cache to force fresh data collection
      const { cache } = await import('../src/lib/redis');
      await cache.invalidate('aggregated:*');
    }

    // Run aggregation
    const results = await dataAggregator.aggregateAllData();

    logger.info(`Aggregation complete. Processed ${results.length} providers`);

    // Log summary
    for (const result of results) {
      logger.info(`${result.provider}: ${result.models.length} models, ${result.changes.length} changes, confidence: ${result.confidence}`);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Data aggregation failed:', error);
    process.exit(1);
  }
}

main();
import { prisma } from '../src/lib/prisma';
import { logger } from '../src/utils/logger';

interface QualityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

async function checkDataQuality(): Promise<QualityCheck[]> {
  const checks: QualityCheck[] = [];

  // 1. Check for models without pricing
  const modelsWithoutPricing = await prisma.model.count({
    where: {
      pricing: {
        none: {}
      }
    }
  });

  checks.push({
    name: 'Models without pricing',
    passed: modelsWithoutPricing === 0,
    message: `${modelsWithoutPricing} models have no pricing data`,
    severity: modelsWithoutPricing > 10 ? 'critical' : 'warning'
  });

  // 2. Check for stale data (not updated in 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const staleModels = await prisma.model.count({
    where: {
      lastVerified: {
        lt: sevenDaysAgo
      }
    }
  });

  checks.push({
    name: 'Stale model data',
    passed: staleModels === 0,
    message: `${staleModels} models not verified in 7 days`,
    severity: staleModels > 20 ? 'critical' : 'warning'
  });

  // 3. Check for models with unknown data source
  const unknownSourceModels = await prisma.model.count({
    where: {
      OR: [
        { dataSource: 'unknown' },
        { dataSource: null }
      ]
    }
  });

  checks.push({
    name: 'Unknown data sources',
    passed: unknownSourceModels === 0,
    message: `${unknownSourceModels} models with unknown data source`,
    severity: unknownSourceModels > 5 ? 'warning' : 'info'
  });

  // 4. Check for providers without models
  const providersWithoutModels = await prisma.provider.findMany({
    where: {
      models: {
        none: {}
      }
    },
    select: {
      slug: true
    }
  });

  checks.push({
    name: 'Empty providers',
    passed: providersWithoutModels.length === 0,
    message: `${providersWithoutModels.length} providers have no models`,
    severity: providersWithoutModels.length > 0 ? 'warning' : 'info'
  });

  // 5. Check for high config dependency
  const totalModels = await prisma.model.count();
  const configModels = await prisma.model.count({
    where: {
      dataSource: 'config'
    }
  });

  const configPercentage = (configModels / totalModels) * 100;

  checks.push({
    name: 'Config dependency',
    passed: configPercentage < 30,
    message: `${configPercentage.toFixed(1)}% of models use config data`,
    severity: configPercentage > 50 ? 'critical' : configPercentage > 30 ? 'warning' : 'info'
  });

  return checks;
}

async function main() {
  try {
    logger.info('Running data quality checks...');

    const checks = await checkDataQuality();

    // Log results
    const criticalChecks = checks.filter(c => !c.passed && c.severity === 'critical');
    const warningChecks = checks.filter(c => !c.passed && c.severity === 'warning');
    const passedChecks = checks.filter(c => c.passed);

    logger.info(`Quality check results: ${passedChecks.length} passed, ${warningChecks.length} warnings, ${criticalChecks.length} critical`);

    for (const check of checks) {
      if (!check.passed) {
        logger[check.severity === 'critical' ? 'error' : 'warn'](`❌ ${check.name}: ${check.message}`);
      } else {
        logger.info(`✅ ${check.name}: Passed`);
      }
    }

    // Exit with error code if critical checks failed
    if (criticalChecks.length > 0) {
      logger.error('Critical quality checks failed');
      process.exit(1);
    }

    // Exit with warning code if warnings exist
    if (warningChecks.length > 0) {
      logger.warn('Quality checks completed with warnings');
      process.exit(2);
    }

    logger.info('All quality checks passed');
    process.exit(0);
  } catch (error) {
    logger.error('Quality check failed:', error);
    process.exit(1);
  }
}

main();
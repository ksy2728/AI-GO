import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DataQualityReport {
  timestamp: Date;
  totalModels: number;
  fieldAnalysis: {
    intelligenceScore: FieldQuality;
    outputSpeed: FieldQuality;
    inputPrice: FieldQuality;
    outputPrice: FieldQuality;
  };
  overallQuality: number;
  recommendations: string[];
}

interface FieldQuality {
  total: number;
  notNull: number;
  nullCount: number;
  zeroCount: number;
  validCount: number;
  completionRate: number;
  averageValue?: number;
  distribution?: Record<string, number>;
}

async function analyzeFieldQuality(
  fieldName: string,
  values: any[]
): Promise<FieldQuality> {
  const total = values.length;
  const notNullValues = values.filter(v => v !== null && v !== undefined);
  const nonZeroValues = notNullValues.filter(v => Number(v) !== 0);

  const quality: FieldQuality = {
    total,
    notNull: notNullValues.length,
    nullCount: total - notNullValues.length,
    zeroCount: notNullValues.length - nonZeroValues.length,
    validCount: nonZeroValues.length,
    completionRate: (nonZeroValues.length / total) * 100,
  };

  if (nonZeroValues.length > 0) {
    const numericValues = nonZeroValues.map(v => Number(v));
    quality.averageValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

    // Create distribution buckets
    if (fieldName.includes('Score')) {
      quality.distribution = {
        '0-20': numericValues.filter(v => v <= 20).length,
        '21-40': numericValues.filter(v => v > 20 && v <= 40).length,
        '41-60': numericValues.filter(v => v > 40 && v <= 60).length,
        '61-80': numericValues.filter(v => v > 60 && v <= 80).length,
        '81-100': numericValues.filter(v => v > 80).length,
      };
    }
  }

  return quality;
}

async function analyzeAAModelsJSON(): Promise<any> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/aa-models.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const models = data.models || [];

    const analysis = {
      totalModels: models.length,
      fieldsWithData: {
        intelligenceScore: models.filter((m: any) => m.intelligenceScore && m.intelligenceScore !== 70).length,
        outputSpeed: models.filter((m: any) => m.outputSpeed && m.outputSpeed !== 100).length,
        inputPrice: models.filter((m: any) => m.inputPrice && m.inputPrice !== 5).length,
        outputPrice: models.filter((m: any) => m.outputPrice && m.outputPrice !== 10).length,
      },
      defaultValues: {
        intelligenceScore70: models.filter((m: any) => m.intelligenceScore === 70).length,
        outputSpeed100: models.filter((m: any) => m.outputSpeed === 100).length,
        inputPrice5: models.filter((m: any) => m.inputPrice === 5).length,
        outputPrice10: models.filter((m: any) => m.outputPrice === 10).length,
      }
    };

    return analysis;
  } catch (error) {
    console.error('Failed to analyze aa-models.json:', error);
    return null;
  }
}

async function analyzeDataQuality(): Promise<DataQualityReport> {
  console.log('🔍 Starting comprehensive data quality analysis...\n');

  // Fetch all models with their data
  const models = await prisma.model.findMany({
    where: { isActive: true },
    include: {
      provider: true,
      pricing: {
        where: { region: 'global' },
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      },
    },
  });

  console.log(`📊 Analyzing ${models.length} active models...\n`);

  // Extract field values
  const intelligenceScores = models.map(m => m.intelligenceScore);
  const outputSpeeds = models.map(m => m.outputSpeed);
  const inputPrices = models.map(m => m.pricing[0]?.inputPerMillion || null);
  const outputPrices = models.map(m => m.pricing[0]?.outputPerMillion || null);

  // Analyze each field
  const fieldAnalysis = {
    intelligenceScore: await analyzeFieldQuality('intelligenceScore', intelligenceScores),
    outputSpeed: await analyzeFieldQuality('outputSpeed', outputSpeeds),
    inputPrice: await analyzeFieldQuality('inputPrice', inputPrices),
    outputPrice: await analyzeFieldQuality('outputPrice', outputPrices),
  };

  // Calculate overall quality score
  const overallQuality =
    (fieldAnalysis.intelligenceScore.completionRate +
     fieldAnalysis.outputSpeed.completionRate +
     fieldAnalysis.inputPrice.completionRate +
     fieldAnalysis.outputPrice.completionRate) / 4;

  // Generate recommendations
  const recommendations: string[] = [];

  if (fieldAnalysis.intelligenceScore.completionRate < 80) {
    recommendations.push('⚠️ Intelligence score data is incomplete. Need to improve AA scraping for this field.');
  }

  if (fieldAnalysis.outputSpeed.completionRate < 80) {
    recommendations.push('⚠️ Output speed data is mostly missing. Scraper needs to extract tokens/s values.');
  }

  if (fieldAnalysis.inputPrice.completionRate < 80) {
    recommendations.push('⚠️ Input pricing data is incomplete. Need to sync pricing data from AA.');
  }

  if (fieldAnalysis.outputPrice.completionRate < 80) {
    recommendations.push('⚠️ Output pricing data is incomplete. Need to sync pricing data from AA.');
  }

  const report: DataQualityReport = {
    timestamp: new Date(),
    totalModels: models.length,
    fieldAnalysis,
    overallQuality,
    recommendations,
  };

  return report;
}

async function printReport(report: DataQualityReport) {
  console.log('=' .repeat(70));
  console.log('📊 DATA QUALITY ANALYSIS REPORT');
  console.log('=' .repeat(70));
  console.log(`📅 Timestamp: ${report.timestamp.toISOString()}`);
  console.log(`📦 Total Models: ${report.totalModels}`);
  console.log(`⭐ Overall Quality Score: ${report.overallQuality.toFixed(1)}%\n`);

  console.log('📈 Field-by-Field Analysis:');
  console.log('-' .repeat(70));

  Object.entries(report.fieldAnalysis).forEach(([field, quality]) => {
    console.log(`\n📌 ${field}:`);
    console.log(`   Total: ${quality.total}`);
    console.log(`   Valid (non-null, non-zero): ${quality.validCount} (${quality.completionRate.toFixed(1)}%)`);
    console.log(`   NULL values: ${quality.nullCount}`);
    console.log(`   Zero values: ${quality.zeroCount}`);

    if (quality.averageValue !== undefined) {
      console.log(`   Average value: ${quality.averageValue.toFixed(2)}`);
    }

    if (quality.distribution) {
      console.log(`   Distribution:`);
      Object.entries(quality.distribution).forEach(([range, count]) => {
        console.log(`      ${range}: ${count} models`);
      });
    }
  });

  console.log('\n' + '=' .repeat(70));
  console.log('📋 Recommendations:');
  console.log('-' .repeat(70));

  if (report.recommendations.length === 0) {
    console.log('✅ Data quality is excellent! No immediate improvements needed.');
  } else {
    report.recommendations.forEach(rec => console.log(rec));
  }

  // Also analyze aa-models.json
  console.log('\n' + '=' .repeat(70));
  console.log('📄 AA Models JSON Analysis:');
  console.log('-' .repeat(70));

  const aaAnalysis = await analyzeAAModelsJSON();
  if (aaAnalysis) {
    console.log(`Total models in JSON: ${aaAnalysis.totalModels}`);
    console.log('\nFields with real data:');
    console.log(`  Intelligence Score: ${aaAnalysis.fieldsWithData.intelligenceScore} (${(aaAnalysis.fieldsWithData.intelligenceScore/aaAnalysis.totalModels*100).toFixed(1)}%)`);
    console.log(`  Output Speed: ${aaAnalysis.fieldsWithData.outputSpeed} (${(aaAnalysis.fieldsWithData.outputSpeed/aaAnalysis.totalModels*100).toFixed(1)}%)`);
    console.log(`  Input Price: ${aaAnalysis.fieldsWithData.inputPrice} (${(aaAnalysis.fieldsWithData.inputPrice/aaAnalysis.totalModels*100).toFixed(1)}%)`);
    console.log(`  Output Price: ${aaAnalysis.fieldsWithData.outputPrice} (${(aaAnalysis.fieldsWithData.outputPrice/aaAnalysis.totalModels*100).toFixed(1)}%)`);

    console.log('\nModels with default values:');
    console.log(`  Intelligence = 70: ${aaAnalysis.defaultValues.intelligenceScore70}`);
    console.log(`  Speed = 100: ${aaAnalysis.defaultValues.outputSpeed100}`);
    console.log(`  Input Price = $5: ${aaAnalysis.defaultValues.inputPrice5}`);
    console.log(`  Output Price = $10: ${aaAnalysis.defaultValues.outputPrice10}`);
  }

  console.log('\n' + '=' .repeat(70));

  // Save report to file
  const reportPath = path.join(process.cwd(), 'data-quality-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    const report = await analyzeDataQuality();
    await printReport(report);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
#!/usr/bin/env node
/**
 * Verify cleanup results directly from database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('============================================');
  console.log('   Database Verification');
  console.log('============================================\n');

  try {
    // Check for any remaining test patterns
    const testPatterns = await prisma.model.findMany({
      where: {
        OR: [
          { name: { contains: 'test', mode: 'insensitive' }},
          { name: { contains: 'demo', mode: 'insensitive' }},
          { name: { contains: 'example', mode: 'insensitive' }},
          { name: { contains: 'simulation', mode: 'insensitive' }},
          { name: { contains: 'GPT-5' }},
          { name: { contains: 'gpt-oss' }},
          { name: { contains: 'Grok 3 mini' }}
        ]
      },
      select: {
        name: true,
        slug: true,
        intelligenceScore: true
      }
    });

    const totalCount = await prisma.model.count();

    console.log('📊 Database Status:');
    console.log(`  Total models: ${totalCount}`);
    console.log(`  Test patterns found: ${testPatterns.length}`);

    if (testPatterns.length > 0) {
      console.log('\n⚠️  Test models still in database:');
      testPatterns.forEach(m => {
        console.log(`  - ${m.name} (Intelligence: ${m.intelligenceScore || 'N/A'})`);
      });
    } else {
      console.log('  ✅ No test data in database!');
    }

    // Show top models
    console.log('\n🌟 Top models by intelligence:');
    const topModels = await prisma.model.findMany({
      take: 10,
      orderBy: { intelligenceScore: 'desc' },
      select: {
        name: true,
        intelligenceScore: true,
        provider: {
          select: { name: true }
        }
      }
    });

    topModels.forEach(m => {
      console.log(`  - ${m.name} (${m.provider?.name || 'Unknown'}) - Intelligence: ${m.intelligenceScore || 'N/A'}`);
    });

    // Check data sources
    const sources = await prisma.model.groupBy({
      by: ['dataSource'],
      _count: { dataSource: true }
    });

    console.log('\n📦 Data sources:');
    sources.forEach(s => {
      console.log(`  - ${s.dataSource || 'null'}: ${s._count.dataSource} models`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n============================================');
  console.log('   Verification Complete');
  console.log('============================================');
}

verify().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
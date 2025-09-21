const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeFakeData() {
  try {
    console.log('🧹 Removing fake speed/price data...');

    // Reset all speed and price data to null
    const result = await prisma.model.updateMany({
      where: {
        OR: [
          { outputSpeed: { not: null } },
          { inputPrice: { not: null } },
          { outputPrice: { not: null } }
        ]
      },
      data: {
        outputSpeed: null,
        inputPrice: null,
        outputPrice: null
      }
    });

    console.log(`✅ Reset ${result.count} models to original state (null values)`);

    // Verify
    const speedCount = await prisma.model.count({
      where: { outputSpeed: { not: null } }
    });

    const priceCount = await prisma.model.count({
      where: {
        OR: [
          { inputPrice: { not: null } },
          { outputPrice: { not: null } }
        ]
      }
    });

    console.log('\n📊 Verification:');
    console.log(`  - Models with speed data: ${speedCount} (should be 0)`);
    console.log(`  - Models with price data: ${priceCount} (should be 0)`);

  } catch (error) {
    console.error('❌ Error removing fake data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeFakeData();
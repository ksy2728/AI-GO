const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpeedPriceData() {
  try {
    // Check models with speed data
    const modelsWithSpeed = await prisma.model.count({
      where: {
        outputSpeed: {
          not: null,
          gt: 0
        }
      }
    });

    // Check models with price data
    const modelsWithInputPrice = await prisma.model.count({
      where: {
        inputPrice: {
          not: null,
          gt: 0
        }
      }
    });

    const modelsWithOutputPrice = await prisma.model.count({
      where: {
        outputPrice: {
          not: null,
          gt: 0
        }
      }
    });

    // Get sample speed data
    const sampleSpeed = await prisma.model.findMany({
      where: {
        outputSpeed: {
          not: null,
          gt: 0
        }
      },
      select: {
        name: true,
        outputSpeed: true
      },
      take: 5
    });

    // Get sample price data
    const samplePrice = await prisma.model.findMany({
      where: {
        inputPrice: {
          not: null,
          gt: 0
        }
      },
      select: {
        name: true,
        inputPrice: true,
        outputPrice: true
      },
      take: 5
    });

    console.log(`\n📊 Speed/Price Data Status:`);
    console.log(`- Models with speed data: ${modelsWithSpeed}`);
    console.log(`- Models with input price: ${modelsWithInputPrice}`);
    console.log(`- Models with output price: ${modelsWithOutputPrice}`);

    if (sampleSpeed.length > 0) {
      console.log(`\n🚀 Sample Speed Data:`);
      sampleSpeed.forEach(m => {
        console.log(`  - ${m.name}: ${m.outputSpeed} tokens/s`);
      });
    }

    if (samplePrice.length > 0) {
      console.log(`\n💰 Sample Price Data:`);
      samplePrice.forEach(m => {
        console.log(`  - ${m.name}: Input=$${m.inputPrice}, Output=$${m.outputPrice}`);
      });
    }

  } catch (error) {
    console.error('Error checking speed/price data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpeedPriceData();
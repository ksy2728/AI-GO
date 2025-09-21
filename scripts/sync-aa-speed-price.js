const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function syncAASpeedPriceData() {
  try {
    console.log('🔄 Starting AA Speed/Price data sync...');

    // Read real AA data from the real-aa-data.json file
    const dataPath = path.join(__dirname, 'real-aa-data.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const aaModels = data.models || [];

    console.log(`📊 Retrieved ${aaModels.length} models from AA sync endpoint`);

    let updated = 0;
    let matched = 0;

    for (const aaModel of aaModels) {
      // Find matching model in database by name
      const dbModel = await prisma.model.findFirst({
        where: {
          OR: [
            { name: aaModel.name },
            { name: { contains: aaModel.name, mode: 'insensitive' } }
          ]
        }
      });

      if (dbModel) {
        matched++;

        // Only update if we have real data (not null/0)
        const updateData = {};

        if (aaModel.outputSpeed && aaModel.outputSpeed > 0) {
          updateData.outputSpeed = aaModel.outputSpeed;
        }

        if (aaModel.inputPrice && aaModel.inputPrice > 0) {
          updateData.inputPrice = aaModel.inputPrice;
        }

        if (aaModel.outputPrice && aaModel.outputPrice > 0) {
          updateData.outputPrice = aaModel.outputPrice;
        }

        // Only update if we have data to update
        if (Object.keys(updateData).length > 0) {
          await prisma.model.update({
            where: { id: dbModel.id },
            data: updateData
          });

          updated++;
          console.log(`  ✅ Updated ${dbModel.name}: Speed=${updateData.outputSpeed || 'N/A'}, Input=$${updateData.inputPrice || 'N/A'}, Output=$${updateData.outputPrice || 'N/A'}`);
        }
      }
    }

    console.log(`\n📊 Sync Results:`);
    console.log(`  - AA Models: ${aaModels.length}`);
    console.log(`  - Matched in DB: ${matched}`);
    console.log(`  - Updated: ${updated}`);

    // Verify the update
    const speedCount = await prisma.model.count({
      where: { outputSpeed: { not: null, gt: 0 } }
    });

    const priceCount = await prisma.model.count({
      where: {
        AND: [
          { inputPrice: { not: null, gt: 0 } },
          { outputPrice: { not: null, gt: 0 } }
        ]
      }
    });

    console.log('\n📊 Database Status:');
    console.log(`  - Models with speed data: ${speedCount}`);
    console.log(`  - Models with price data: ${priceCount}`);

    // Show some examples
    const examples = await prisma.model.findMany({
      where: {
        outputSpeed: { not: null, gt: 0 }
      },
      include: { provider: true },
      take: 5
    });

    if (examples.length > 0) {
      console.log('\n📝 Sample synced data:');
      examples.forEach(m => {
        console.log(`  - ${m.name} (${m.provider.name}):`);
        console.log(`    Speed: ${m.outputSpeed} tokens/s`);
        console.log(`    Price: Input=$${m.inputPrice}/M, Output=$${m.outputPrice}/M`);
      });
    }

  } catch (error) {
    console.error('❌ Error syncing AA data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncAASpeedPriceData();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSpeedPriceData() {
  try {
    console.log('🌱 Starting Speed/Price data seeding...');

    // Get all models with intelligence scores
    const models = await prisma.model.findMany({
      where: {
        intelligenceScore: {
          not: null,
          gt: 0
        }
      },
      include: {
        provider: true
      }
    });

    console.log(`📊 Found ${models.length} models with intelligence scores`);

    let updated = 0;

    for (const model of models) {
      // Generate realistic speed based on intelligence score
      // Higher intelligence usually means slightly lower speed
      const baseSpeed = 150 - model.intelligenceScore;
      const speedVariation = Math.random() * 20 - 10; // +/- 10 tokens/s
      const outputSpeed = Math.max(10, Math.round(baseSpeed + speedVariation));

      // Generate price based on intelligence and provider
      // Higher intelligence = higher price
      const basePriceMultiplier = model.intelligenceScore / 50;

      let inputPrice, outputPrice;

      // Provider-specific pricing patterns
      if (model.provider.name.toLowerCase().includes('openai')) {
        inputPrice = basePriceMultiplier * 2.5; // $2.5-5 per million
        outputPrice = basePriceMultiplier * 7.5; // $7.5-15 per million
      } else if (model.provider.name.toLowerCase().includes('anthropic')) {
        inputPrice = basePriceMultiplier * 3.0; // $3-6 per million
        outputPrice = basePriceMultiplier * 15.0; // $15-30 per million
      } else if (model.provider.name.toLowerCase().includes('google')) {
        inputPrice = basePriceMultiplier * 1.25; // $1.25-2.5 per million
        outputPrice = basePriceMultiplier * 3.75; // $3.75-7.5 per million
      } else {
        // Other providers - generally cheaper
        inputPrice = basePriceMultiplier * 0.5; // $0.5-1 per million
        outputPrice = basePriceMultiplier * 1.5; // $1.5-3 per million
      }

      // Add some variation
      inputPrice = Math.round(inputPrice * (0.8 + Math.random() * 0.4) * 100) / 100;
      outputPrice = Math.round(outputPrice * (0.8 + Math.random() * 0.4) * 100) / 100;

      // Update the model
      await prisma.model.update({
        where: { id: model.id },
        data: {
          outputSpeed,
          inputPrice,
          outputPrice
        }
      });

      updated++;

      if (updated % 10 === 0) {
        console.log(`  ✅ Updated ${updated}/${models.length} models...`);
      }
    }

    console.log(`\n✨ Successfully seeded ${updated} models with speed/price data!`);

    // Verify the update
    const speedCount = await prisma.model.count({
      where: { outputSpeed: { not: null, gt: 0 } }
    });

    const priceCount = await prisma.model.count({
      where: {
        inputPrice: { not: null, gt: 0 },
        outputPrice: { not: null, gt: 0 }
      }
    });

    console.log('\n📊 Verification:');
    console.log(`  - Models with speed data: ${speedCount}`);
    console.log(`  - Models with price data: ${priceCount}`);

    // Show some examples
    const examples = await prisma.model.findMany({
      where: {
        outputSpeed: { not: null },
        inputPrice: { not: null }
      },
      include: { provider: true },
      take: 5
    });

    console.log('\n📝 Sample seeded data:');
    examples.forEach(m => {
      console.log(`  - ${m.name} (${m.provider.name}):`);
      console.log(`    Speed: ${m.outputSpeed} tokens/s`);
      console.log(`    Price: Input=$${m.inputPrice}/M, Output=$${m.outputPrice}/M`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSpeedPriceData();
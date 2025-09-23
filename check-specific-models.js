#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificModels() {
  console.log('Checking specific models with 80 score...\n');

  const models = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: 'Gemini 1.5 Pro' }},
        { name: { contains: 'Gemini 1.5 Flash-8B' }},
        { name: { contains: 'Claude 3.5 Sonnet' }}
      ]
    },
    select: {
      id: true,
      name: true,
      intelligenceScore: true,
      outputSpeed: true,
      metadata: true,
      dataSource: true,
      lastVerified: true
    }
  });

  for (const model of models) {
    let meta = {};
    try {
      meta = JSON.parse(model.metadata || '{}');
    } catch (e) {}

    console.log(`${model.name}:`);
    console.log(`  ID: ${model.id}`);
    console.log(`  DB Intelligence: ${model.intelligenceScore}`);
    console.log(`  DB Speed: ${model.outputSpeed}`);
    console.log(`  Metadata Intelligence: ${meta.aa?.intelligenceScore || 'N/A'}`);
    console.log(`  Metadata Speed: ${meta.aa?.outputSpeed || 'N/A'}`);
    console.log(`  Data Source: ${model.dataSource}`);
    console.log(`  Last Verified: ${model.lastVerified}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkSpecificModels().catch(console.error);
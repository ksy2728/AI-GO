const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function countModels() {
  const count = await prisma.model.count()
  console.log('Total models in DB:', count)
  
  const activeCount = await prisma.model.count({ where: { isActive: true } })
  console.log('Active models:', activeCount)
  
  // Get providers
  const providers = await prisma.provider.findMany()
  console.log('Providers:', providers.map(p => p.name).join(', '))
  
  await prisma.$disconnect()
}

countModels()
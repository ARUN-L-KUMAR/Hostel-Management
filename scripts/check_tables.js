const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if provision_purchases table exists
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provision_purchases'`;
    console.log('Tables found:', result);

    // Try to query provisionPurchase
    const purchases = await prisma.provisionPurchase.findMany();
    console.log('Provision purchases:', purchases);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
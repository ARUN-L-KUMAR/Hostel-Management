const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateBillsWithPerDayRates() {
  try {
    console.log('Updating bills with per day rates...');

    // Get all bills first
    const allBills = await prisma.bill.findMany({
      select: {
        id: true,
        month: true,
        provisionPerDayRate: true,
        advancePerDayRate: true
      }
    });

    console.log(`Found ${allBills.length} bills to check`);

    let updatedCount = 0;
    for (const bill of allBills) {
      if (bill.provisionPerDayRate === null || bill.advancePerDayRate === null) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: {
            provisionPerDayRate: bill.provisionPerDayRate || 25.00,
            advancePerDayRate: bill.advancePerDayRate || 18.75
          }
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} bills with default per day rates`);

    // Verify the updates
    const bills = await prisma.bill.findMany({
      select: {
        month: true,
        provisionPerDayRate: true,
        advancePerDayRate: true
      },
      orderBy: {
        month: 'desc'
      },
      take: 5
    });

    console.log('Sample updated bills:');
    bills.forEach(bill => {
      console.log(`${bill.month}: provision=${bill.provisionPerDayRate}, advance=${bill.advancePerDayRate}`);
    });

  } catch (error) {
    console.error('Error updating bills:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBillsWithPerDayRates();
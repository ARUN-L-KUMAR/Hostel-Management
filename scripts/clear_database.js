const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    console.log('🗑️ Clearing database...')

    // Delete in order to respect foreign key constraints
    console.log('Deleting attendance records...')
    await prisma.attendance.deleteMany()

    console.log('Deleting inmate monthly summaries...')
    await prisma.inmateMonthlySummary.deleteMany()

    console.log('Deleting student bills...')
    await prisma.studentBill.deleteMany()

    console.log('Deleting students...')
    await prisma.student.deleteMany()

    console.log('Deleting provision usage...')
    await prisma.provisionUsage.deleteMany()

    console.log('Deleting expenses...')
    await prisma.expense.deleteMany()

    console.log('Deleting bills...')
    await prisma.bill.deleteMany()

    console.log('Deleting provision items...')
    await prisma.provisionItem.deleteMany()

    console.log('Deleting hostels...')
    await prisma.hostel.deleteMany()

    console.log('Deleting mando settings...')
    await prisma.mandoSettings.deleteMany()

    console.log('Deleting billing settings...')
    await prisma.billingSettings.deleteMany()

    console.log('Deleting audit logs...')
    await prisma.auditLog.deleteMany()

    console.log('Deleting users...')
    await prisma.user.deleteMany()

    console.log('✅ Database cleared successfully!')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase()
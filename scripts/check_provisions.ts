import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProvisions() {
  console.log("🔍 Checking provisions in database...")

  try {
    const provisions = await prisma.provisionItem.findMany({
      include: {
        usage: true
      }
    })
    console.log(`📦 Found ${provisions.length} provision items:`)
    provisions.forEach(provision => {
      console.log(`  - ${provision.name} (${provision.unit}) - ₹${provision.unitCost} - Usage: ${provision.usage?.length || 0} records`)
    })

  } catch (error) {
    console.error("❌ Error checking provisions:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProvisions()
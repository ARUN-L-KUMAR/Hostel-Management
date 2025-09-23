import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkHostels() {
  console.log("🔍 Checking hostels in database...")

  try {
    const hostels = await prisma.hostel.findMany()
    console.log(`🏠 Found ${hostels.length} hostels:`)
    hostels.forEach(hostel => {
      console.log(`  - ${hostel.name} (ID: ${hostel.id})`)
    })

    // Check a few students and their hostels
    const students = await prisma.student.findMany({
      take: 5,
      include: { hostel: true }
    })

    console.log(`\n👥 Sample students with hostels:`)
    students.forEach(student => {
      console.log(`  - ${student.name} (${student.rollNo}): ${student.hostel?.name || 'No hostel'}`)
    })

  } catch (error) {
    console.error("❌ Error checking hostels:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkHostels()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMandoHostels() {
  try {
    console.log('Checking mando students and their hostels...')

    const mandoStudents = await prisma.student.findMany({
      where: { isMando: true },
      include: { hostel: true }
    })

    console.log(`Found ${mandoStudents.length} mando students:`)

    mandoStudents.forEach(student => {
      console.log(`- ${student.name}: hostelId=${student.hostelId}, hostel=${student.hostel?.name || 'NULL'}`)
    })

    // Also check meal records
    const mealRecords = await prisma.mealRecord.findMany({
      include: {
        student: {
          include: { hostel: true }
        }
      },
      take: 5
    })

    console.log(`\nSample meal records:`)
    mealRecords.forEach(record => {
      console.log(`- Student: ${record.student?.name}, Hostel: ${record.student?.hostel?.name || 'NULL'}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMandoHostels()
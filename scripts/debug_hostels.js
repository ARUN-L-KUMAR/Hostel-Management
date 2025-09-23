const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugHostels() {
  try {
    console.log('🔍 Checking hostels...')
    const hostels = await prisma.hostel.findMany()
    console.log('📊 Hostels in database:')
    hostels.forEach(h => console.log(`  - ${h.name} (ID: ${h.id})`))

    console.log('\n👥 Sample students with hostels:')
    const students = await prisma.student.findMany({
      take: 10,
      include: { hostel: true }
    })
    
    students.forEach(s => {
      console.log(`  - ${s.name} (${s.rollNo}): Hostel "${s.hostel?.name}" (ID: ${s.hostelId})`)
    })

    console.log('\n📈 Student count by hostel:')
    const boysCount = await prisma.student.count({
      where: { hostel: { name: 'Boys' } }
    })
    const girlsCount = await prisma.student.count({
      where: { hostel: { name: 'Girls' } }
    })
    
    console.log(`  - Boys: ${boysCount}`)
    console.log(`  - Girls: ${girlsCount}`)
    
    console.log('\n📈 Student count by year:')
    for (let year = 1; year <= 4; year++) {
      const count = await prisma.student.count({
        where: { year }
      })
      console.log(`  - Year ${year}: ${count}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugHostels()
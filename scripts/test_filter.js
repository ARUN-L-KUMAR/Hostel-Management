const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testHostelFilter() {
  try {
    console.log('🔍 Testing hostel filter...')
    
    // Test exact query that's failing
    const where = {
      hostel: {
        name: "Boys"
      },
      status: "ACTIVE"
    }
    
    console.log('📊 Query where clause:', JSON.stringify(where))
    
    const students = await prisma.student.findMany({
      where,
      include: {
        hostel: true,
      },
      orderBy: { name: "asc" },
    })
    
    console.log(`📈 Found ${students.length} students`)
    
    // Show first few results
    console.log('\n👥 First 5 results:')
    students.slice(0, 5).forEach(s => {
      console.log(`  - ${s.name} (${s.rollNo}): Hostel "${s.hostel?.name}" Status: ${s.status}`)
    })
    
    // Test without status filter
    console.log('\n🔍 Testing without status filter...')
    const studentsNoStatus = await prisma.student.findMany({
      where: {
        hostel: {
          name: "Boys"
        }
      },
      include: {
        hostel: true,
      },
      orderBy: { name: "asc" },
    })
    
    console.log(`📈 Found ${studentsNoStatus.length} students (without status filter)`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testHostelFilter()
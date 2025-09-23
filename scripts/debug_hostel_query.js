const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugHostelQuery() {
  try {
    console.log('🔍 Testing the exact failing query...')
    
    // This is the exact query from the logs that's failing
    const where = {
      hostel: {
        name: "Boys"
      }
    }
    
    console.log('📊 Query where clause:', JSON.stringify(where, null, 2))
    
    const result = await prisma.student.findMany({
      where,
      include: {
        hostel: true,
      },
      orderBy: { name: "asc" },
    })
    
    console.log(`📈 Query result: ${result.length} students`)
    
    // Let's also test different query approaches
    console.log('\n🔍 Testing alternative query approaches...')
    
    // Direct hostel ID approach
    const result2 = await prisma.student.findMany({
      where: {
        hostelId: "hostel_boys"
      },
      include: {
        hostel: true,
      },
      orderBy: { name: "asc" },
    })
    
    console.log(`📈 Direct hostelId query result: ${result2.length} students`)
    
    // Check if there are any null hostels
    const nullHostels = await prisma.student.count({
      where: {
        hostel: null
      }
    })
    
    console.log(`📈 Students with null hostel: ${nullHostels}`)
    
    // Show some sample data structure
    console.log('\n👥 Sample student data structure:')
    const sample = await prisma.student.findFirst({
      include: { hostel: true }
    })
    
    console.log('Sample student:', JSON.stringify(sample, null, 2))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugHostelQuery()
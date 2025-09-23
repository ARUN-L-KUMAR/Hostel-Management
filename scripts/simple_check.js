const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function simpleCheck() {
  try {
    console.log('🔍 Simple data check...')
    
    // Count total students
    const total = await prisma.student.count()
    console.log(`📊 Total students: ${total}`)
    
    // Group by hostelId
    const groups = await prisma.student.groupBy({
      by: ['hostelId'],
      _count: { _all: true }
    })
    
    console.log('\n📊 Students by hostelId:')
    for (const group of groups) {
      console.log(`  - HostelId "${group.hostelId}": ${group._count._all} students`)
    }
    
    // Get hostel names
    const hostels = await prisma.hostel.findMany()
    console.log('\n🏠 Available hostels:')
    hostels.forEach(h => {
      console.log(`  - ID: "${h.id}", Name: "${h.name}"`)
    })
    
    // Sample students with hostel info
    const samples = await prisma.student.findMany({
      take: 5,
      include: { hostel: true }
    })
    
    console.log('\n👥 Sample students:')
    samples.forEach(s => {
      console.log(`  - ${s.name}: HostelId="${s.hostelId}", HostelName="${s.hostel?.name || 'NULL'}"`)
    })
    
    // Test the exact problematic query
    console.log('\n🔍 Testing Boys hostel filter...')
    const boysStudents = await prisma.student.findMany({
      where: {
        hostel: {
          name: "Boys"
        }
      },
      include: { hostel: true }
    })
    
    console.log(`📈 Boys students found: ${boysStudents.length}`)
    
    // Show first few Boys students
    console.log('\n👥 First 3 Boys students:')
    boysStudents.slice(0, 3).forEach(s => {
      console.log(`  - ${s.name}: HostelName="${s.hostel?.name}"`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simpleCheck()
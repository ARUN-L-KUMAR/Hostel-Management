const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDataIntegrity() {
  try {
    console.log('🔍 Checking data integrity...')
    
    // Check if all students have hostel assigned
    const totalStudents = await prisma.student.count()
    const studentsWithHostel = await prisma.student.count({
      where: {
        NOT: {
          hostelId: null
        }
      }
    })
    
    console.log(`📊 Total students: ${totalStudents}`)
    console.log(`📊 Students with hostel: ${studentsWithHostel}`)
    
    // Check unique hostel assignments
    const hostelCounts = await prisma.student.groupBy({
      by: ['hostelId'],
      _count: {
        _all: true
      }
    })
    
    console.log('\n📊 Students by hostelId:')
    for (const group of hostelCounts) {
      console.log(`  - HostelId "${group.hostelId}": ${group._count._all} students`)
    }
    
    // Check if there are students with null hostelId
    const nullHostelStudents = await prisma.student.findMany({
      where: {
        hostelId: null
      },
      take: 5
    })
    
    if (nullHostelStudents.length > 0) {
      console.log('\n⚠️ Students with null hostelId:')
      nullHostelStudents.forEach(s => {
        console.log(`  - ${s.name} (${s.rollNo})`)
      })
    }
    
    // Test the exact failing query step by step
    console.log('\n🔍 Testing problematic query step by step...')
    
    // First, test the basic query
    const allWithHostel = await prisma.student.findMany({
      include: { hostel: true },
      take: 5
    })
    
    console.log('\n👥 Sample students with hostel data:')
    allWithHostel.forEach(s => {
      console.log(`  - ${s.name}: HostelId="${s.hostelId}", HostelName="${s.hostel?.name}"`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDataIntegrity()
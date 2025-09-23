import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyData() {
  console.log('🔍 Verifying database data...')

  // Check students count
  const totalStudents = await prisma.student.count()
  console.log(`📊 Total students: ${totalStudents}`)

  // Check by hostel
  const boysCount = await prisma.student.count({
    where: { hostelId: 'hostel_boys' }
  })
  
  const girlsCount = await prisma.student.count({
    where: { hostelId: 'hostel_girls' }
  })

  console.log(`🏠 Boys hostel: ${boysCount} students`)
  console.log(`🏠 Girls hostel: ${girlsCount} students`)

  // Check mando students
  const mandoCount = await prisma.student.count({
    where: { isMando: true }
  })
  console.log(`💼 Mando students: ${mandoCount}`)

  // Check by year
  const students2021 = await prisma.student.count({
    where: { year: 2021 }
  })
  const students2022 = await prisma.student.count({
    where: { year: 2022 }
  })
  const students2023 = await prisma.student.count({
    where: { year: 2023 }
  })

  console.log(`📅 Students by year:`)
  console.log(`   2021: ${students2021}`)
  console.log(`   2022: ${students2022}`)
  console.log(`   2023: ${students2023}`)

  // Check provision items
  const provisionCount = await prisma.provisionItem.count()
  console.log(`📦 Provision items: ${provisionCount}`)

  // Show sample students
  console.log('\n📋 Sample students:')
  const sampleStudents = await prisma.student.findMany({
    take: 5,
    include: {
      hostel: true
    }
  })

  sampleStudents.forEach((student: any) => {
    console.log(`   ${student.name} (${student.rollNo}) - Year ${student.year} - ${student.hostel.name} Hostel${student.isMando ? ' - Mando' : ''}`)
  })

  console.log('\n✅ Database verification completed!')
}

verifyData()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
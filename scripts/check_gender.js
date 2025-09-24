const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkGender() {
  try {
    console.log('Checking mando students gender values...')

    const mandoStudents = await prisma.student.findMany({
      where: { isMando: true },
      select: {
        name: true,
        gender: true
      }
    })

    console.log(`Found ${mandoStudents.length} mando students:`)

    const genderCounts = {}
    mandoStudents.forEach(student => {
      const gender = student.gender || 'null'
      genderCounts[gender] = (genderCounts[gender] || 0) + 1
      console.log(`- ${student.name}: gender=${gender}`)
    })

    console.log('\nGender distribution:')
    Object.entries(genderCounts).forEach(([gender, count]) => {
      console.log(`${gender}: ${count} students`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGender()
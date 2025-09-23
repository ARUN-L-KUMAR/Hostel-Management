import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateStudentHostels() {
  console.log("🔄 Updating student hostels based on roll numbers...")

  try {
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        rollNo: true,
        hostelId: true,
      },
    })

    console.log(`📊 Found ${students.length} students to check`)

    let updatedCount = 0
    let skippedCount = 0

    for (const student of students) {
      const rollNo = student.rollNo.toUpperCase()
      let newHostelId = null

      // Check if roll number contains 'B' or 'G'
      if (rollNo.includes('B')) {
        newHostelId = 'hostel_boys'
      } else if (rollNo.includes('G')) {
        newHostelId = 'hostel_girls'
      }

      // Update if hostel needs to be changed
      if (newHostelId && newHostelId !== student.hostelId) {
        await prisma.student.update({
          where: { id: student.id },
          data: { hostelId: newHostelId },
        })

        console.log(`✅ Updated ${student.name} (${student.rollNo}): ${student.hostelId} → ${newHostelId}`)
        updatedCount++
      } else if (!newHostelId) {
        console.log(`⚠️  Skipped ${student.name} (${student.rollNo}): No B/G found in roll number`)
        skippedCount++
      } else {
        // Already correct
        skippedCount++
      }
    }

    console.log("\n📈 Summary:")
    console.log(`✅ Updated: ${updatedCount} students`)
    console.log(`⏭️  Skipped: ${skippedCount} students`)
    console.log("🎉 Hostel update completed!")

  } catch (error) {
    console.error("❌ Error updating student hostels:", error)
    process.exit(1)
  }
}

// Run the script
updateStudentHostels()
  .then(async () => {
    console.log("🏁 Script finished successfully")
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error("💥 Script failed:", error)
    await prisma.$disconnect()
    process.exit(1)
  })
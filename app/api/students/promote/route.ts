import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Define status constants to match our database
const StudentStatus = {
  ACTIVE: 'ACTIVE',
  VACATE: 'VACATE',
  GRADUATED: 'GRADUATED',
  TRANSFERRED: 'TRANSFERRED'
} as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { promoteType = "both" } = body

    // Build where clause based on selection
    const where: any = {
      status: StudentStatus.ACTIVE
    }

    if (promoteType === "regular") {
      where.isMando = false
    } else if (promoteType === "mando") {
      where.isMando = true
    }
    // For "both", no additional filter is needed

    // Get active students based on selection
    const students = await prisma.student.findMany({
      where,
      // Note: Using custom db helper, so we'll get basic student objects
    })

    console.log(`Found ${students.length} active students to process`)

    let promotedCount = 0
    let graduatedCount = 0
    let mandoPromotedCount = 0
    let mandoGraduatedCount = 0

    // Process each active student
    for (const student of students) {
      if (student.year < 4) {
        // Promote to next year
        await prisma.student.update({
          where: { id: student.id },
          data: { year: student.year + 1 }
        })
        promotedCount++
        if (student.isMando) mandoPromotedCount++
        console.log(`Promoted ${student.isMando ? 'mando' : 'regular'} student ${student.name} (${student.rollNo}) from year ${student.year} to ${student.year + 1}`)
      } else if (student.year === 4) {
        // Graduate 4th year students
        await prisma.student.update({
          where: { id: student.id },
          data: { status: StudentStatus.GRADUATED }
        })
        graduatedCount++
        if (student.isMando) mandoGraduatedCount++
        console.log(`Graduated ${student.isMando ? 'mando' : 'regular'} student ${student.name} (${student.rollNo})`)
      }
    }

    const message = `Successfully promoted ${promotedCount} students (${mandoPromotedCount} mando) and graduated ${graduatedCount} students (${mandoGraduatedCount} mando)`

    return NextResponse.json({
      message,
      promotedCount,
      graduatedCount,
      mandoPromotedCount,
      mandoGraduatedCount
    })

  } catch (error) {
    console.error("Error promoting students:", error)
    return NextResponse.json({ error: "Failed to promote students" }, { status: 500 })
  }
}
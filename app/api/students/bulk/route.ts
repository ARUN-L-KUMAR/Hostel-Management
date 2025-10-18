import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { students } = body

    if (!Array.isArray(students)) {
      return NextResponse.json({ error: "Students must be an array" }, { status: 400 })
    }

    const results = {
      successfulCount: 0,
      failedCount: 0,
      warnings: [] as string[],
      errors: [] as string[]
    }

    // Process students in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize)

      for (const studentData of batch) {
        try {
          const { name, rollNo, dept, year, gender, hostelId, isMando } = studentData

          // Validate required fields
          if (!name || !rollNo || !year || !hostelId) {
            results.failedCount++
            results.errors.push(`Missing required fields for student: ${JSON.stringify(studentData)}`)
            continue
          }

          // Ensure hostel exists
          const hostelExists = await prisma.hostel.findUnique({
            where: { id: hostelId.trim() }
          })

          if (!hostelExists) {
            // Create the hostel
            const hostelName = hostelId === 'hostel_boys' ? 'Boys' : hostelId === 'hostel_girls' ? 'Girls' : hostelId.replace('hostel_', '').replace('_', ' ')
            await prisma.hostel.create({
              data: {
                id: hostelId.trim(),
                name: hostelName,
                description: `${hostelName} Hostel`
              }
            })
          }

          // Check if student already exists
          const existingStudent = await prisma.student.findUnique({
            where: { rollNo }
          })

          if (existingStudent) {
            results.failedCount++
            results.warnings.push(`Student with roll number ${rollNo} already exists`)
            continue
          }

          // Create the student
          const student = await prisma.student.create({
            data: {
              name: name.trim(),
              rollNo: rollNo.trim(),
              dept: dept ? dept.trim() : null,
              year: parseInt(year),
              gender: gender || null,
              hostelId: hostelId.trim(),
              isMando: isMando || false
            }
          })

          // Log the creation
          const currentUserId = await getCurrentUserId()
          await createAuditLog(
            currentUserId,
            "CREATE",
            "student",
            student.id,
            null,
            {
              name: name.trim(),
              rollNo: rollNo.trim(),
              dept: dept ? dept.trim() : null,
              year: parseInt(year),
              gender: gender || null,
              hostelId: hostelId.trim(),
              isMando: isMando || false
            }
          )

          results.successfulCount++
        } catch (error) {
          console.error('Error creating student:', error)
          results.failedCount++
          results.errors.push(`Failed to create student ${studentData.rollNo}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    const message = results.successfulCount > 0
      ? `Successfully imported ${results.successfulCount} students${results.failedCount > 0 ? `, ${results.failedCount} failed` : ''}`
      : 'No students were imported'

    return NextResponse.json({
      message,
      successfulCount: results.successfulCount,
      failedCount: results.failedCount,
      warnings: results.warnings,
      errors: results.errors
    })

  } catch (error) {
    console.error("Error in bulk student import:", error)
    return NextResponse.json({ error: "Failed to import students" }, { status: 500 })
  }
}
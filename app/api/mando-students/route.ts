import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const where: any = {
      isMando: true // Only fetch mando students
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } }
      ]
    }

    const mandoStudents = await prisma.student.findMany({
      where,
      include: {
        hostel: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(mandoStudents, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching mando students:", error)
    return NextResponse.json({ error: "Failed to fetch mando students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, rollNo, dept, year, hostelId } = body

    const mandoStudent = await prisma.student.create({
      data: {
        name,
        rollNo,
        dept,
        year,
        hostelId,
        isMando: true, // Mark as mando student
      },
    })

    // Log the creation
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "CREATE",
      "student",
      mandoStudent.id,
      null,
      {
        name,
        rollNo,
        dept,
        year,
        hostelId,
        isMando: true,
      }
    )

    return NextResponse.json(mandoStudent)
  } catch (error) {
    console.error("Error creating mando student:", error)
    return NextResponse.json({ error: "Failed to create mando student" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, leaveDate, leaveReason } = body

    // Validate the student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (leaveDate) {
      updateData.leaveDate = new Date(leaveDate)
    }

    // Update the student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        hostel: true,
      },
    })

    return NextResponse.json(updatedStudent, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        hostel: true,
        attendance: {
          orderBy: { date: "desc" },
          take: 10, // Last 10 attendance records
        },
        studentBills: {
          include: {
            bill: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Last 5 bills
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json(student, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 })
  }
}
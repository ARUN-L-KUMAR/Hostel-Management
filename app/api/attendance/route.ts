import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Return all attendance records - filtering is done client-side for reliability
    const attendance = await prisma.attendance.findMany({
      include: {
        student: true,
      },
      orderBy: [{ date: "asc" }, { student: { name: "asc" } }],
    })

    return NextResponse.json(attendance, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, date, code } = body

    // Parse date as UTC to avoid timezone issues
    const utcDate = new Date(date + 'T00:00:00.000Z')

    // Get existing attendance for audit logging
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: utcDate,
        },
      },
    })

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: utcDate,
        },
      },
      update: {
        code,
      },
      create: {
        studentId,
        date: utcDate,
        code,
      },
    })

    // Log the attendance change
    const currentUserId = await getCurrentUserId()
    const action = existingAttendance ? "UPDATE" : "CREATE"
    await createAuditLog(
      currentUserId,
      action,
      "attendance",
      `${studentId}_${date}`,
      existingAttendance ? { code: existingAttendance.code } : null,
      { studentId, date, code }
    )

    return NextResponse.json(attendance, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, date } = body

    // Get attendance data before deletion for audit logging
    const attendanceToDelete = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
    })

    const attendance = await prisma.attendance.delete({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "attendance",
      `${studentId}_${date}`,
      attendanceToDelete ? { studentId: attendanceToDelete.studentId, date: attendanceToDelete.date, code: attendanceToDelete.code } : null,
      null
    )

    return NextResponse.json(attendance, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error deleting attendance:", error)
    return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 })
  }
}

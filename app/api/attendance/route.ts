import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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

    const attendance = await prisma.attendance.upsert({
      create: {
        studentId,
        date: utcDate,
        code,
      },
    })

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

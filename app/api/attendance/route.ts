import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const startDate = new Date(Number.parseInt(year || "2024"), Number.parseInt(month || "0"), 1)
    const endDate = new Date(Number.parseInt(year || "2024"), Number.parseInt(month || "0") + 1, 0)

    const attendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: true,
      },
      orderBy: [{ date: "asc" }, { student: { name: "asc" } }],
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, date, breakfast, lunch, dinner } = body

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: new Date(date),
        },
      },
      update: {
        breakfast,
        lunch,
        dinner,
      },
      create: {
        studentId,
        date: new Date(date),
        breakfast,
        lunch,
        dinner,
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}

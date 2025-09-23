import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body // Array of { studentId, date, meal, code }

    const operations = updates.map((update: any) => {
      const { studentId, date, meal, code } = update
      const mealData = { [meal]: code }

      return prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId,
            date: new Date(date),
          },
        },
        update: mealData,
        create: {
          studentId,
          date: new Date(date),
          breakfast: meal === "breakfast" ? code : "P",
          lunch: meal === "lunch" ? code : "P",
          dinner: meal === "dinner" ? code : "P",
        },
      })
    })

    await prisma.$transaction(operations)

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (error) {
    console.error("Error bulk updating attendance:", error)
    return NextResponse.json({ error: "Failed to bulk update attendance" }, { status: 500 })
  }
}

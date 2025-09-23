import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hostel = searchParams.get("hostel")
    const year = searchParams.get("year")
    const isMando = searchParams.get("isMando")

    const where: any = {}
    if (hostel && hostel !== "all") where.hostel = hostel
    if (year && year !== "all") where.year = Number.parseInt(year)
    if (isMando && isMando !== "all") where.isMando = isMando === "true"

    const students = await prisma.student.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, rollNumber, hostel, year, isMando, mandoMultiplier } = body

    const student = await prisma.student.create({
      data: {
        name,
        rollNumber,
        hostel,
        year,
        isMando,
        mandoMultiplier: isMando ? mandoMultiplier : null,
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

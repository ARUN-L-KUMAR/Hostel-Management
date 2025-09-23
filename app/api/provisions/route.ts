import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const provisions = await prisma.provisionItem.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(provisions)
  } catch (error) {
    console.error("Error fetching provisions:", error)
    return NextResponse.json({ error: "Failed to fetch provisions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, unitCost, unitMeasure } = body

    const provision = await prisma.provisionItem.create({
      data: {
        name,
        unit,
        unitCost,
        unitMeasure,
      },
    })

    return NextResponse.json(provision)
  } catch (error) {
    console.error("Error creating provision:", error)
    return NextResponse.json({ error: "Failed to create provision" }, { status: 500 })
  }
}

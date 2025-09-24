import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const mandoSettings = await prisma.mandoSettings.findFirst({
      where: { isActive: true }
    })

    if (!mandoSettings) {
      return NextResponse.json({
        mando: 50,
        outsiders: 50
      })
    }

    return NextResponse.json({
      mando: Number(mandoSettings.perMealRate),
      outsiders: Number(mandoSettings.outsiderMealRate)
    })
  } catch (error) {
    console.error("Error fetching meal rates:", error)
    return NextResponse.json({ error: "Failed to fetch meal rates" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { mando, outsiders } = body

    const updatedSettings = await prisma.mandoSettings.upsert({
      where: { id: "default" }, // Use a fixed ID for the default settings
      update: {
        perMealRate: mando,
        outsiderMealRate: outsiders
      },
      create: {
        id: "default",
        perMealRate: mando,
        outsiderMealRate: outsiders
      }
    })

    return NextResponse.json({
      mando: Number(updatedSettings.perMealRate),
      outsiders: Number(updatedSettings.outsiderMealRate)
    })
  } catch (error) {
    console.error("Error updating meal rates:", error)
    return NextResponse.json({ error: "Failed to update meal rates" }, { status: 500 })
  }
}
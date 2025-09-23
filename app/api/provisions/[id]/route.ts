import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, unit, unitCost, unitMeasure } = body

    const provision = await prisma.provisionItem.update({
      where: { id: params.id },
      data: {
        name: name?.trim(),
        unit,
        unitCost: parseFloat(unitCost),
        unitMeasure,
      },
    })

    return NextResponse.json(provision)
  } catch (error) {
    console.error("Error updating provision:", error)
    return NextResponse.json({ error: "Failed to update provision" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.provisionItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Provision deleted successfully" })
  } catch (error) {
    console.error("Error deleting provision:", error)
    return NextResponse.json({ error: "Failed to delete provision" }, { status: 500 })
  }
}
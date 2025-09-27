import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const outsider = await prisma.outsider.findUnique({
      where: { id: Number(params.id) },
      include: {
        meals: {
          orderBy: { date: "desc" },
        },
      },
    })

    if (!outsider) {
      return NextResponse.json({ error: "Outsider not found" }, { status: 404 })
    }

    return NextResponse.json(outsider)
  } catch (error) {
    console.error("Error fetching outsider:", error)
    return NextResponse.json({ error: "Failed to fetch outsider" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, phone, company, designation, description } = body

    const outsider = await prisma.outsider.update({
      where: { id: Number(params.id) },
      data: {
        name,
        phone,
        company,
        designation,
        description,
      },
    })

    return NextResponse.json(outsider)
  } catch (error) {
    console.error("Error updating outsider:", error)
    return NextResponse.json({ error: "Failed to update outsider" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.outsider.delete({
      where: { id: Number(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting outsider:", error)
    return NextResponse.json({ error: "Failed to delete outsider" }, { status: 500 })
  }
}
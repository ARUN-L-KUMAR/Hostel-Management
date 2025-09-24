import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const mandoStudent = await prisma.student.findUnique({
      where: { id: params.id, isMando: true },
      include: {
        hostel: true,
      },
    })

    if (!mandoStudent) {
      return NextResponse.json({ error: "Mando student not found" }, { status: 404 })
    }

    return NextResponse.json(mandoStudent)
  } catch (error) {
    console.error("Error fetching mando student:", error)
    return NextResponse.json({ error: "Failed to fetch mando student" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, rollNo, dept, year, hostelId } = body

    const mandoStudent = await prisma.student.update({
      where: { id: params.id, isMando: true },
      data: {
        name,
        rollNo,
        dept,
        year,
        hostelId,
      },
    })

    return NextResponse.json(mandoStudent)
  } catch (error) {
    console.error("Error updating mando student:", error)
    return NextResponse.json({ error: "Failed to update mando student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.student.delete({
      where: { id: params.id, isMando: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mando student:", error)
    return NextResponse.json({ error: "Failed to delete mando student" }, { status: 500 })
  }
}
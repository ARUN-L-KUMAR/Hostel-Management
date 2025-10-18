import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

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

    // Get old data for audit logging
    const existingOutsider = await prisma.outsider.findUnique({
      where: { id: Number(params.id) }
    })

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

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "outsider",
      params.id,
      existingOutsider ? {
        name: existingOutsider.name,
        phone: existingOutsider.phone,
        company: existingOutsider.company,
        designation: existingOutsider.designation,
        description: existingOutsider.description,
      } : null,
      {
        name,
        phone,
        company,
        designation,
        description,
      }
    )

    return NextResponse.json(outsider)
  } catch (error) {
    console.error("Error updating outsider:", error)
    return NextResponse.json({ error: "Failed to update outsider" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get outsider data before deletion for audit logging
    const outsiderToDelete = await prisma.outsider.findUnique({
      where: { id: Number(params.id) }
    })

    await prisma.outsider.delete({
      where: { id: Number(params.id) },
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "outsider",
      params.id,
      outsiderToDelete ? {
        name: outsiderToDelete.name,
        phone: outsiderToDelete.phone,
        company: outsiderToDelete.company,
        designation: outsiderToDelete.designation,
        description: outsiderToDelete.description,
      } : null,
      null
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting outsider:", error)
    return NextResponse.json({ error: "Failed to delete outsider" }, { status: 500 })
  }
}
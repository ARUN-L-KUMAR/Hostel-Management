import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, unit, unitCost, unitMeasure } = body

    // Get old data for audit logging
    const existingProvision = await prisma.provisionItem.findUnique({
      where: { id: params.id }
    })

    const provision = await prisma.provisionItem.update({
      where: { id: params.id },
      data: {
        name: name?.trim(),
        unit,
        unitCost: parseFloat(unitCost),
        unitMeasure,
      },
    })

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "provisionItem",
      params.id,
      existingProvision ? {
        name: existingProvision.name,
        unit: existingProvision.unit,
        unitCost: existingProvision.unitCost,
        unitMeasure: existingProvision.unitMeasure,
      } : null,
      {
        name: provision.name,
        unit: provision.unit,
        unitCost: provision.unitCost,
        unitMeasure: provision.unitMeasure,
      }
    )

    return NextResponse.json(provision)
  } catch (error) {
    console.error("Error updating provision:", error)
    return NextResponse.json({ error: "Failed to update provision" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get provision data before deletion for audit logging
    const provisionToDelete = await prisma.provisionItem.findUnique({
      where: { id: params.id }
    })

    await prisma.provisionItem.delete({
      where: { id: params.id },
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "provisionItem",
      params.id,
      provisionToDelete ? {
        name: provisionToDelete.name,
        unit: provisionToDelete.unit,
        unitCost: provisionToDelete.unitCost,
        unitMeasure: provisionToDelete.unitMeasure,
      } : null,
      null
    )

    return NextResponse.json({ message: "Provision deleted successfully" })
  } catch (error) {
    console.error("Error deleting provision:", error)
    return NextResponse.json({ error: "Failed to delete provision" }, { status: 500 })
  }
}
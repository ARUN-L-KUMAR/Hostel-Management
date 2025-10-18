import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

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

    // Get old data for audit logging
    const existingMandoStudent = await prisma.student.findUnique({
      where: { id: params.id, isMando: true }
    })

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

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "student",
      params.id,
      existingMandoStudent ? {
        name: existingMandoStudent.name,
        rollNo: existingMandoStudent.rollNo,
        dept: existingMandoStudent.dept,
        year: existingMandoStudent.year,
        hostelId: existingMandoStudent.hostelId,
        isMando: existingMandoStudent.isMando,
      } : null,
      {
        name,
        rollNo,
        dept,
        year,
        hostelId,
        isMando: true,
      }
    )

    return NextResponse.json(mandoStudent)
  } catch (error) {
    console.error("Error updating mando student:", error)
    return NextResponse.json({ error: "Failed to update mando student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get mando student data before deletion for audit logging
    const mandoStudentToDelete = await prisma.student.findUnique({
      where: { id: params.id, isMando: true }
    })

    await prisma.student.delete({
      where: { id: params.id, isMando: true },
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "student",
      params.id,
      mandoStudentToDelete ? {
        name: mandoStudentToDelete.name,
        rollNo: mandoStudentToDelete.rollNo,
        dept: mandoStudentToDelete.dept,
        year: mandoStudentToDelete.year,
        hostelId: mandoStudentToDelete.hostelId,
        isMando: mandoStudentToDelete.isMando,
      } : null,
      null
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mando student:", error)
    return NextResponse.json({ error: "Failed to delete mando student" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export async function GET() {
  try {
    const semesters = await prisma.semester.findMany({
      include: {
        feeStructures: true,
        _count: {
          select: { feeRecords: true }
        }
      },
      orderBy: { startDate: "desc" },
    })

    return NextResponse.json(semesters)
  } catch (error) {
    console.error("Error fetching semesters:", error)
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, startDate, endDate, baseAmount } = body

    // Create semester
    const semester = await prisma.semester.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    // Create fee structure for this semester
    const feeStructure = await prisma.feeStructure.create({
      data: {
        semesterId: semester.id,
        baseAmount: parseFloat(baseAmount),
        finalAmount: parseFloat(baseAmount), // Initially same as base amount
      },
    })

    // Log the creation
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "CREATE",
      "semester",
      semester.id.toString(),
      null,
      {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        baseAmount: parseFloat(baseAmount)
      }
    )

    return NextResponse.json({
      semester,
      feeStructure
    })
  } catch (error) {
    console.error("Error creating semester:", error)
    return NextResponse.json({ error: "Failed to create semester" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, startDate, endDate, baseAmount } = body

    // Update semester
    const semester = await prisma.semester.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    // Update fee structure if baseAmount is provided
    if (baseAmount !== undefined) {
      await prisma.feeStructure.updateMany({
        where: { semesterId: parseInt(id) },
        data: {
          baseAmount: parseFloat(baseAmount),
          finalAmount: parseFloat(baseAmount), // Reset final amount to match base
        },
      })
    }

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "semester",
      id,
      null, // Skip old data for now due to model constraints
      {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        baseAmount: baseAmount ? parseFloat(baseAmount) : undefined
      }
    )

    return NextResponse.json({ semester })
  } catch (error) {
    console.error("Error updating semester:", error)
    return NextResponse.json({ error: "Failed to update semester" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Semester ID is required" }, { status: 400 })
    }

    // Delete fee records first (due to foreign key constraints)
    await prisma.feeRecord.deleteMany({
      where: { semesterId: parseInt(id) }
    })

    // Delete fee structures
    await prisma.feeStructure.deleteMany({
      where: { semesterId: parseInt(id) }
    })

    // Delete semester
    await prisma.semester.delete({
      where: { id: parseInt(id) }
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "semester",
      id,
      null, // Skip old data for now due to model constraints
      null
    )

    return NextResponse.json({ message: "Semester deleted successfully" })
  } catch (error) {
    console.error("Error deleting semester:", error)
    return NextResponse.json({ error: "Failed to delete semester" }, { status: 500 })
  }
}
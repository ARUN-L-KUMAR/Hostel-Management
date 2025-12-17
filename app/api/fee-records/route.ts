import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semesterId')

    const whereClause = semesterId ? { semesterId: parseInt(semesterId) } : {}

    const feeRecords = await prisma.feeRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            dept: true,
            year: true,
            hostel: {
              select: { name: true }
            }
          }
        },
        semester: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { student: { name: 'asc' } },
    })

    return NextResponse.json(feeRecords)
  } catch (error) {
    console.error("Error fetching fee records:", error)
    return NextResponse.json({ error: "Failed to fetch fee records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, semesterId, amountPaid, paymentMode, feeRecordId, updateBalance, newBalance } = body

    // Get the fee structure for this semester
    const feeStructure = await prisma.feeStructure.findFirst({
      where: { semesterId: parseInt(semesterId) }
    })

    if (!feeStructure) {
      return NextResponse.json({ error: "Fee structure not found for this semester" }, { status: 404 })
    }

    // Check if fee record already exists
    const existingRecords = await prisma.feeRecord.findMany({
      where: {
        studentId,
        semesterId: parseInt(semesterId)
      }
    })
    const existingRecord = existingRecords.length > 0 ? existingRecords[0] : null

    // Always try to update first, if it doesn't exist, create it
    try {
      let newAmountPaid

      // If amountPaid is 0 and paymentMode is null, this is a "mark as unpaid" action
      if (parseFloat(amountPaid) === 0 && paymentMode === null) {
        newAmountPaid = 0 // Set to unpaid
      } else {
        // For existing records, add to current payment; for new records, use the amount directly
        if (existingRecord) {
          const currentAmountPaid = (existingRecord as any).amountPaid || 0
          newAmountPaid = currentAmountPaid + parseFloat(amountPaid)
        } else {
          newAmountPaid = parseFloat(amountPaid)
        }
      }

      const balance = feeStructure.finalAmount - newAmountPaid

      if (existingRecord) {
        // Update existing record using the fee record ID if provided, otherwise use composite key
        const updateWhere = feeRecordId ? { id: parseInt(feeRecordId) } : {
          studentId_semesterId: {
            studentId,
            semesterId: parseInt(semesterId)
          }
        }

        // If updateBalance is true, use the provided newBalance instead of calculating
        const finalBalance = updateBalance ? parseFloat(newBalance) : balance

        const updatedRecord = await prisma.feeRecord.update({
          where: updateWhere,
          data: {
            amountPaid: updateBalance ? (existingRecord as any).amountPaid : newAmountPaid,
            balance: finalBalance,
            paymentMode: updateBalance ? (existingRecord as any).paymentMode : (paymentMode || (existingRecord as any).paymentMode)
          }
        })

        // Log the fee record update
        const currentUserId = await getCurrentUserId()
        await createAuditLog(
          currentUserId,
          "UPDATE",
          "feeRecord",
          updatedRecord.id.toString(),
          existingRecord ? {
            amountPaid: (existingRecord as any).amountPaid,
            balance: (existingRecord as any).balance,
            paymentMode: (existingRecord as any).paymentMode
          } : null,
          {
            studentId: updatedRecord.studentId,
            semesterId: updatedRecord.semesterId,
            amountPaid: updateBalance ? (existingRecord as any).amountPaid : newAmountPaid,
            balance: finalBalance,
            paymentMode: updateBalance ? (existingRecord as any).paymentMode : (paymentMode || (existingRecord as any).paymentMode)
          }
        )

        return NextResponse.json({
          id: updatedRecord.id,
          studentId: updatedRecord.studentId,
          semesterId: updatedRecord.semesterId,
          totalDue: updatedRecord.totalDue,
          amountPaid: updatedRecord.amountPaid,
          balance: updatedRecord.balance,
          paymentMode: updatedRecord.paymentMode,
          paymentDate: updatedRecord.paymentDate,
          createdAt: updatedRecord.createdAt,
          updatedAt: updatedRecord.updatedAt
        })
      } else {
        // Create new record
        console.log("[API] Creating new fee record with data:", {
          studentId,
          semesterId: parseInt(semesterId),
          totalDue: feeStructure.finalAmount,
          amountPaid: newAmountPaid,
          balance,
          paymentMode
        })

        const finalBalance = updateBalance ? parseFloat(newBalance) : balance

        const newRecord = await prisma.feeRecord.create({
          data: {
            studentId,
            semesterId: parseInt(semesterId),
            totalDue: feeStructure.finalAmount,
            amountPaid: newAmountPaid,
            balance: finalBalance,
            paymentMode
          }
        })

        console.log("[API] Created fee record:", newRecord)

        if (!newRecord) {
          throw new Error("Failed to create fee record - returned undefined")
        }

        // Log the fee record creation
        const currentUserId = await getCurrentUserId()
        await createAuditLog(
          currentUserId,
          "CREATE",
          "feeRecord",
          newRecord.id.toString(),
          null,
          {
            studentId: newRecord.studentId,
            semesterId: newRecord.semesterId,
            totalDue: newRecord.totalDue,
            amountPaid: newRecord.amountPaid,
            balance: newRecord.balance,
            paymentMode: newRecord.paymentMode
          }
        )

        return NextResponse.json({
          id: newRecord.id,
          studentId: newRecord.studentId,
          semesterId: newRecord.semesterId,
          totalDue: newRecord.totalDue,
          amountPaid: newRecord.amountPaid,
          balance: newRecord.balance,
          paymentMode: newRecord.paymentMode,
          paymentDate: newRecord.paymentDate,
          createdAt: newRecord.createdAt,
          updatedAt: newRecord.updatedAt
        })
      }
    } catch (error) {
      console.error("Error in fee record operation:", error)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating/updating fee record:", error)
    return NextResponse.json({ error: "Failed to process fee payment" }, { status: 500 })
  }
}
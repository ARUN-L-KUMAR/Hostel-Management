import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { computeMandays, AttendanceCode } from "@/lib/calculations"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    // Get or create bill for the month
    let bill = await prisma.bill.findUnique({
      where: { month: `${year}-${month.toString().padStart(2, '0')}` },
    })

    if (!bill) {
      // Create a default bill if it doesn't exist
      bill = await prisma.bill.create({
        data: {
          month: `${year}-${month.toString().padStart(2, '0')}`,
          totalExpense: 0,
          labourTotal: 0,
          provisionTotal: 0, // Not used anymore
          carryForward: 0,
          advanceTotal: 0, // Not used anymore
          perDayRate: 49.48, // Default
          provisionPerDayRate: 25.00, // Default
          advancePerDayRate: 18.75, // Default
          totalMandays: 0,
        },
      })
    }

    // Get all students with attendance for the month
    const students = await prisma.student.findMany({
      include: {
        hostel: true,
        attendance: {
          where: {
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        },
      },
    })

    // Calculate total mandays and student data
    let totalMandays = 0
    const studentsData = []

    for (const student of students) {
      const attendanceRecords = student.attendance.map((att: any) => ({
        code: att.code as AttendanceCode,
        date: new Date(att.date),
      }))

      const mandays = computeMandays(attendanceRecords)
      totalMandays += mandays

      const laborCharge = mandays * bill.perDayRate
      const provisionCharge = (bill.provisionPerDayRate || 25.00) * mandays
      const advancePaid = (bill.advancePerDayRate || 18.75) * mandays
      const totalAmount = advancePaid - (laborCharge + provisionCharge)

      studentsData.push({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        dept: student.dept,
        hostel: student.hostel.name,
        mandays,
        laborCharge,
        provisionCharge,
        advancePaid,
        totalAmount,
      })
    }

    return NextResponse.json({
      bill: {
        perDayRate: bill.perDayRate,
        provisionPerDayRate: bill.provisionPerDayRate || 25.00,
        advancePerDayRate: bill.advancePerDayRate || 18.75,
      },
      students: studentsData,
      totalMandays,
    })
  } catch (error) {
    console.error("Error fetching billing overview:", error)
    return NextResponse.json({ error: "Failed to fetch billing overview" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, perDayRate, provisionPerDayRate, advancePerDayRate } = body

    const monthStr = `${year}-${month.toString().padStart(2, '0')}`

    // Update or create bill with new settings
    const bill = await prisma.bill.upsert({
      where: { month: monthStr },
      update: {
        perDayRate: parseFloat(perDayRate),
        provisionPerDayRate: parseFloat(provisionPerDayRate),
        advancePerDayRate: parseFloat(advancePerDayRate),
      },
      create: {
        month: monthStr,
        totalExpense: 0,
        labourTotal: parseFloat(perDayRate) * 800, // Estimate
        provisionTotal: 0, // Not used anymore
        carryForward: 0,
        advanceTotal: 0, // Not used anymore
        perDayRate: parseFloat(perDayRate),
        provisionPerDayRate: parseFloat(provisionPerDayRate),
        advancePerDayRate: parseFloat(advancePerDayRate),
        totalMandays: 800, // Estimate
      },
    })

    // Log the billing settings update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "bill",
      monthStr,
      null,
      {
        month: monthStr,
        perDayRate: parseFloat(perDayRate),
        provisionPerDayRate: parseFloat(provisionPerDayRate),
        advancePerDayRate: parseFloat(advancePerDayRate)
      }
    )

    return NextResponse.json({ success: true, bill })
  } catch (error) {
    console.error("Error updating billing settings:", error)
    return NextResponse.json({ error: "Failed to update billing settings" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, studentBills, mandoCoverage } = body

    // Create bills for all students
    const billOperations = studentBills.map((bill: any) =>
      prisma.bill.upsert({
        where: {
          studentId_month_year: {
            studentId: bill.studentId,
            month,
            year,
          },
        },
        update: {
          totalAmount: bill.totalAmount,
          mandoCovered: bill.mandoCovered,
          finalAmount: bill.finalAmount,
          status: "PENDING",
        },
        create: {
          studentId: bill.studentId,
          month,
          year,
          totalAmount: bill.totalAmount,
          mandoCovered: bill.mandoCovered,
          finalAmount: bill.finalAmount,
          status: "PENDING",
        },
      }),
    )

    // Update Mando coverage tracking
    const mandoOperation = prisma.mandoCoverage.upsert({
      where: {
        month_year: { month, year },
      },
      update: {
        totalCovered: mandoCoverage.totalCovered,
        boysAmount: mandoCoverage.boysAmount,
        girlsAmount: mandoCoverage.girlsAmount,
        remainingBudget: mandoCoverage.remainingBudget,
      },
      create: {
        month,
        year,
        totalCovered: mandoCoverage.totalCovered,
        boysAmount: mandoCoverage.boysAmount,
        girlsAmount: mandoCoverage.girlsAmount,
        remainingBudget: mandoCoverage.remainingBudget,
      },
    })

    await prisma.$transaction([...billOperations, mandoOperation])

    return NextResponse.json({ success: true, billsCreated: studentBills.length })
  } catch (error) {
    console.error("Error publishing billing:", error)
    return NextResponse.json({ error: "Failed to publish billing" }, { status: 500 })
  }
}

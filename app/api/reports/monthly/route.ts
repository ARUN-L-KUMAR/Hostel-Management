import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = Number.parseInt(searchParams.get("month") || "0")
    const year = Number.parseInt(searchParams.get("year") || "2024")

    // Get expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(year, month, 1),
          lte: new Date(year, month + 1, 0),
        },
      },
      include: {
        provisionItem: true,
      },
    })

    // Get attendance stats
    const attendanceStats = await prisma.attendance.groupBy({
      by: ["breakfast", "lunch", "dinner"],
      where: {
        date: {
          gte: new Date(year, month, 1),
          lte: new Date(year, month + 1, 0),
        },
      },
      _count: true,
    })

    // Get billing data
    const bills = await prisma.bill.findMany({
      where: { month, year },
      include: {
        student: true,
      },
    })

    const report = {
      expenses: {
        total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        byCategory: expenses.reduce((acc: any, exp) => {
          const category = exp.provisionItem?.category || "Other"
          acc[category] = (acc[category] || 0) + exp.amount
          return acc
        }, {}),
        items: expenses,
      },
      attendance: attendanceStats,
      billing: {
        totalBills: bills.length,
        totalAmount: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
        mandoCovered: bills.reduce((sum, bill) => sum + bill.mandoCovered, 0),
        finalAmount: bills.reduce((sum, bill) => sum + bill.finalAmount, 0),
      },
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error generating monthly report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}

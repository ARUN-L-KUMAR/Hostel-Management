import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const where: any = {}

    // Apply date filters
    if (month && year) {
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`)
      const endDate = new Date(Number.parseInt(year), Number.parseInt(month), 0)
      endDate.setUTCHours(23, 59, 59, 999)

      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        bill: true,
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(expenses, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, amount, date, description, billId } = body

    const expense = await prisma.expense.create({
      data: {
        name,
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        billId: billId || null,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
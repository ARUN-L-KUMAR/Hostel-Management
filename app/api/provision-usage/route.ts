import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const usages = await prisma.provisionUsage.findMany({
      where,
      include: {
        provisionItem: true
      },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(usages)
  } catch (error) {
    console.error("Error fetching provision usages:", error)
    return NextResponse.json({ error: "Failed to fetch provision usages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provisionItemId, date, fromDate, toDate, quantity } = body

    const usage = await prisma.provisionUsage.create({
      data: {
        provisionItemId,
        date: new Date(date),
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        quantity
      },
      include: {
        provisionItem: true
      }
    })

    // Log the creation
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "CREATE",
      "provisionUsage",
      usage.id,
      null,
      {
        provisionItemId,
        date: new Date(date),
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        quantity
      }
    )

    return NextResponse.json(usage)
  } catch (error) {
    console.error("Error creating provision usage:", error)
    return NextResponse.json({ error: "Failed to create provision usage" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, provisionItemId, date, fromDate, toDate, quantity } = body

    const usage = await prisma.provisionUsage.update({
      where: { id },
      data: {
        provisionItemId,
        date: new Date(date),
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        quantity
      },
      include: {
        provisionItem: true
      }
    })

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "provisionUsage",
      id,
      null, // Skip old data for now due to model constraints
      {
        provisionItemId,
        date: new Date(date),
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        quantity
      }
    )

    return NextResponse.json(usage)
  } catch (error) {
    console.error("Error updating provision usage:", error)
    return NextResponse.json({ error: "Failed to update provision usage" }, { status: 500 })
  }
}
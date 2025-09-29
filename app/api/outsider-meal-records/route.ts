import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const outsiderId = searchParams.get("outsiderId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const where: any = {}

    if (outsiderId) {
      where.outsiderId = Number(outsiderId)
    }

    if (month && year) {
      // Filter by month and year
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const mealRecords = await prisma.outsiderMealRecord.findMany({
      where,
      include: {
        outsider: true
      },
      orderBy: { date: "desc" },
    })

    // Serialize Date objects for JSON response
    const serializedRecords = mealRecords.map(record => ({
      ...record,
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : null,
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
      updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
      outsider: record.outsider ? {
        ...record.outsider,
        createdAt: record.outsider.createdAt ? new Date(record.outsider.createdAt).toISOString() : null,
        updatedAt: record.outsider.updatedAt ? new Date(record.outsider.updatedAt).toISOString() : null,
      } : null,
    }))

    return NextResponse.json(serializedRecords)
  } catch (error) {
    console.error("Error fetching outsider meal records:", error)
    return NextResponse.json({ error: "Failed to fetch outsider meal records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { outsiderId, date, breakfast, lunch, dinner, memberCount } = body

    // Validate required fields
    if (!outsiderId || !date) {
      return NextResponse.json({ error: "outsiderId and date are required" }, { status: 400 })
    }

    // Get current meal rate from settings (assuming same rate for outsiders)
    const mandoSettings = await prisma.mandoSettings.findFirst({
      where: { isActive: true }
    })
    const mealRate = mandoSettings?.perMealRate || 50

    // Parse date as UTC to avoid timezone issues
    const utcDate = new Date(date + 'T00:00:00.000Z')

    const mealRecord = await prisma.outsiderMealRecord.upsert({
      where: {
        outsiderId_date: {
          outsiderId,
          date: utcDate
        }
      },
      update: {
        breakfast: breakfast !== undefined ? breakfast : false,
        lunch: lunch !== undefined ? lunch : false,
        dinner: dinner !== undefined ? dinner : false,
        memberCount: memberCount !== undefined ? memberCount : 1
      },
      create: {
        outsiderId,
        date: utcDate,
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        mealRate,
        memberCount: memberCount || 1
      }
    })

    if (!mealRecord) {
      return NextResponse.json({ error: "Failed to create or update outsider meal record" }, { status: 500 })
    }

    // Convert Date objects to ISO strings for JSON serialization
    const serializedRecord = {
      ...mealRecord,
      date: mealRecord.date ? new Date(mealRecord.date).toISOString().split('T')[0] : null,
      createdAt: mealRecord.createdAt ? new Date(mealRecord.createdAt).toISOString() : null,
      updatedAt: mealRecord.updatedAt ? new Date(mealRecord.updatedAt).toISOString() : null,
    }

    return NextResponse.json(serializedRecord, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error upserting outsider meal record:", error)
    return NextResponse.json({ error: "Failed to upsert outsider meal record" }, { status: 500 })
  }
}
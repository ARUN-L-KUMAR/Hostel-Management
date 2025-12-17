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
    const { id, outsiderId, date, breakfast, lunch, dinner, others, mealRate: customMealRate, memberCount } = body

    // Validate required fields
    if (!outsiderId || !date) {
      return NextResponse.json({ error: "outsiderId and date are required" }, { status: 400 })
    }

    // Use custom mealRate from client, or fall back to settings
    let mealRate = customMealRate
    if (mealRate === undefined || mealRate === null) {
      const mandoSettings = await prisma.mandoSettings.findFirst({
        where: { isActive: true }
      })
      mealRate = mandoSettings?.outsiderMealRate || 50
    }

    // Parse date as UTC to avoid timezone issues
    const utcDate = new Date(date + 'T00:00:00.000Z')

    let mealRecord

    if (id) {
      // Update existing record
      mealRecord = await prisma.outsiderMealRecord.update({
        where: { id: Number(id) },
        data: {
          outsiderId,
          date: utcDate,
          breakfast: breakfast !== undefined ? breakfast : false,
          lunch: lunch !== undefined ? lunch : false,
          dinner: dinner !== undefined ? dinner : false,
          others: others || null,
          mealRate,
          memberCount: memberCount !== undefined ? memberCount : 1
        }
      })
    } else {
      // Create new record
      // Let's try to find one first to emulate upsert behavior safely
      const existing = await prisma.outsiderMealRecord.findFirst({
        where: {
          outsiderId: outsiderId,
          date: utcDate
        }
      })

      if (existing) {
        mealRecord = await prisma.outsiderMealRecord.update({
          where: { id: existing.id },
          data: {
            breakfast: breakfast || false,
            lunch: lunch || false,
            dinner: dinner || false,
            others: others || null,
            mealRate,
            memberCount: memberCount || 1
          }
        })
      } else {
        mealRecord = await prisma.outsiderMealRecord.create({
          data: {
            outsiderId,
            date: utcDate,
            breakfast: breakfast || false,
            lunch: lunch || false,
            dinner: dinner || false,
            others: others || null,
            mealRate,
            memberCount: memberCount || 1
          }
        })
      }
    }

    if (!mealRecord) {
      return NextResponse.json({ error: "Failed to create or update outsider meal record" }, { status: 500 })
    }

    // Convert Date objects to ISO strings for JSON serialization
    const serializedRecord = {
      ...mealRecord,
      date: mealRecord.date ? new Date(mealRecord.date).toISOString().split('T')[0] : null,
      createdAt: (mealRecord as any).createdAt ? new Date((mealRecord as any).createdAt).toISOString() : null, // casting as any because createdAt might not be in the type if schema is older
      updatedAt: (mealRecord as any).updatedAt ? new Date((mealRecord as any).updatedAt).toISOString() : null,
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
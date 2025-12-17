import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { neon } from "@neondatabase/serverless"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (month && year) {
      // Filter by month and year
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    } else {
      const startDateParam = searchParams.get("startDate")
      const endDateParam = searchParams.get("endDate")

      if (startDateParam && endDateParam) {
        where.date = {
          gte: new Date(startDateParam),
          lte: new Date(endDateParam)
        }
      }
    }

    const mealRecords = await prisma.mealRecord.findMany({
      where: {
        ...where,
        student: {
          isMando: true
        }
      },
      include: {
        student: {
          include: {
            hostel: true
          }
        }
      },
      orderBy: { date: "asc" },
    })

    // Serialize Date objects for JSON response
    const serializedRecords = mealRecords.map(record => ({
      ...record,
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : null,
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
      updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
      student: record.student ? {
        ...record.student,
        createdAt: record.student.createdAt ? new Date(record.student.createdAt).toISOString() : null,
        updatedAt: record.student.updatedAt ? new Date(record.student.updatedAt).toISOString() : null,
        hostel: record.student.hostel ? {
          ...record.student.hostel,
          createdAt: record.student.hostel.createdAt ? new Date(record.student.hostel.createdAt).toISOString() : null,
          updatedAt: record.student.hostel.updatedAt ? new Date(record.student.hostel.updatedAt).toISOString() : null,
        } : null,
      } : null,
    }))

    return NextResponse.json(serializedRecords)
  } catch (error) {
    console.error("Error fetching mando meal records:", error)
    return NextResponse.json({ error: "Failed to fetch mando meal records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, date, breakfast, lunch, dinner, present } = body

    console.log('[API] POST /api/mando-meal-records called with:', { studentId, date, breakfast, lunch, dinner, present })

    // Validate required fields
    if (!studentId || !date) {
      return NextResponse.json({ error: "studentId and date are required" }, { status: 400 })
    }

    // Get current meal rate from settings
    const mandoSettings = await prisma.mandoSettings.findFirst({
      where: { isActive: true }
    })
    const mealRate = mandoSettings?.perMealRate || 50

    // Parse date as UTC to avoid timezone issues
    const utcDate = new Date(date + 'T00:00:00.000Z')

    // Build update object - only update fields that are explicitly sent
    const updateData: any = {}
    if (breakfast !== undefined) updateData.breakfast = breakfast
    if (lunch !== undefined) updateData.lunch = lunch
    if (dinner !== undefined) updateData.dinner = dinner
    if (present !== undefined) updateData.present = present

    console.log('[API] Update data:', updateData)

    // Use direct SQL update instead of Prisma upsert for present field
    console.log('[API] Using direct SQL update for present field...')

    // First ensure record exists
    await sql`
      INSERT INTO meal_records ("studentId", date, breakfast, lunch, dinner, "mealRate", present)
      VALUES (${studentId}, ${utcDate}, ${breakfast || false}, ${lunch || false}, ${dinner || false}, ${mealRate}, ${present || false})
      ON CONFLICT ("studentId", date)
      DO UPDATE SET
        breakfast = EXCLUDED.breakfast,
        lunch = EXCLUDED.lunch,
        dinner = EXCLUDED.dinner,
        present = EXCLUDED.present
    `

    // Get the updated record
    const updatedRecords = await sql`
      SELECT * FROM meal_records
      WHERE "studentId" = ${studentId} AND date = ${utcDate}
    `
    const mealRecord = updatedRecords[0]

    console.log('[API] Direct SQL updated record:', mealRecord)
    console.log('[API] Present field after direct SQL:', mealRecord.present)

    if (!mealRecord) {
      return NextResponse.json({ error: "Failed to create or update meal record" }, { status: 500 })
    }

    // Convert Date objects to ISO strings for JSON serialization
    const serializedRecord = {
      ...mealRecord,
      date: mealRecord.date ? new Date(mealRecord.date).toISOString().split('T')[0] : null,
      createdAt: mealRecord.createdAt ? new Date(mealRecord.createdAt).toISOString() : null,
      updatedAt: mealRecord.updatedAt ? new Date(mealRecord.updatedAt).toISOString() : null,
    }

    console.log('[API] Serialized present field:', (serializedRecord as any).present)

    // Log the meal record creation/update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "CREATE",
      "mealRecord",
      `${studentId}_${date}`,
      null,
      {
        studentId,
        date: utcDate,
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        present: present || false,
        mealRate
      }
    )

    return NextResponse.json(serializedRecord, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error upserting mando meal record:", error)
    return NextResponse.json({ error: "Failed to upsert mando meal record" }, { status: 500 })
  }
}
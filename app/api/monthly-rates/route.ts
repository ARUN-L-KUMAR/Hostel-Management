import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

// GET: Fetch monthly rates filtered by semesterId
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const semesterId = searchParams.get("semesterId")
        const month = searchParams.get("month")
        const year = searchParams.get("year")

        // Build query
        let query = `
      SELECT mr.*, s.name as semester_name
      FROM monthly_rates mr
      JOIN semesters s ON mr."semesterId" = s.id
      WHERE 1=1
    `
        const conditions: string[] = []

        if (semesterId) {
            conditions.push(`mr."semesterId" = ${parseInt(semesterId)}`)
        }

        if (month) {
            conditions.push(`mr.month = ${parseInt(month)}`)
        }

        if (year) {
            conditions.push(`mr.year = ${parseInt(year)}`)
        }

        if (conditions.length > 0) {
            query += " AND " + conditions.join(" AND ")
        }

        query += ` ORDER BY mr.year DESC, mr.month DESC`

        // Execute with neon client (tagged template not possible with dynamic query string building in this way, 
        // but we can use the result of string building if we are careful or use a different pattern.
        // However, looking at previous fix, the previous code used sql`...` for the base and then filtered in JS. 
        // Let's stick to that safer pattern to avoid template literal issues.)

        const allRates = await sql`
      SELECT mr.*, s.name as semester_name
      FROM monthly_rates mr
      JOIN semesters s ON mr."semesterId" = s.id
      ORDER BY mr.year DESC, mr.month DESC
    `

        // Apply filters in JavaScript to avoid string concatenation risks with tagged templates
        let filtered = allRates

        if (semesterId) {
            const semId = parseInt(semesterId)
            filtered = filtered.filter((row: any) => row.semesterId === semId)
        }

        if (month) {
            const m = parseInt(month)
            filtered = filtered.filter((row: any) => row.month === m)
        }

        if (year) {
            const y = parseInt(year)
            filtered = filtered.filter((row: any) => row.year === y)
        }

        // Transform result if needed
        const result = filtered.map((row: any) => ({
            id: row.id,
            semesterId: row.semesterId,
            month: row.month,
            year: row.year,
            laborRate: row.laborRate,
            provisionRate: row.provisionRate,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            semesterName: row.semester_name
        }))

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching monthly rates:", error)
        return NextResponse.json({ error: "Failed to fetch monthly rates" }, { status: 500 })
    }
}

// POST: Create or update (upsert) monthly rate records
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { laborRate, provisionRate, semesterId, month, year } = body

        if (!semesterId || !month || !year || laborRate === undefined) {
            return NextResponse.json({ error: "Invalid request: missing required fields" }, { status: 400 })
        }

        const now = new Date()
        const semId = parseInt(semesterId)
        const m = parseInt(month)
        const y = parseInt(year)
        const lRate = parseFloat(laborRate)
        const pRate = provisionRate ? parseFloat(provisionRate) : null

        // Check if ANY record exists for this Month/Year (ignoring semester to ensure consistency across semesters)
        // If we want identical data for "December 2024" regardless of semester, we should update the existing record.
        const existing = await sql`
          SELECT id FROM monthly_rates 
          WHERE month = ${m}
            AND year = ${y}
        `

        if (existing.length > 0) {
            // Update ALL existing records for this month/year to keep them in sync
            for (const record of existing) {
                await sql`
            UPDATE monthly_rates SET
              "laborRate" = ${lRate},
              "provisionRate" = ${pRate},
              "updatedAt" = ${now}
            WHERE id = ${record.id}
          `
            }
        } else {
            // Insert new
            await sql`
        INSERT INTO monthly_rates ("semesterId", month, year, "laborRate", "provisionRate", "createdAt", "updatedAt")
        VALUES (${semId}, ${m}, ${y}, ${lRate}, ${pRate}, ${now}, ${now})
      `
        }

        // Log the update
        const currentUserId = await getCurrentUserId()
        await createAuditLog(
            currentUserId,
            "UPDATE_SETTINGS",
            "monthlyRate",
            `${month}_${year}`,
            null,
            {
                semesterId,
                month,
                year,
                laborRate,
                provisionRate
            }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating monthly rates:", error)
        return NextResponse.json({ error: "Failed to update monthly rates" }, { status: 500 })
    }
}

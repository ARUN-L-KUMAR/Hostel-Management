import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = 'force-dynamic'

// GET: Fetch monthly balances filtered by semesterId, month, year
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const semesterId = searchParams.get("semesterId")
        const month = searchParams.get("month")
        const year = searchParams.get("year")
        const studentId = searchParams.get("studentId")

        // Get all monthly balances and filter in JavaScript
        const balances = await sql`
      SELECT mb.*, s.name as student_name, s."rollNo" as student_roll
      FROM monthly_balances mb
      LEFT JOIN students s ON mb."studentId" = s.id
      ORDER BY mb.year DESC, mb.month DESC
    `

        // Apply filters in JavaScript
        let filtered = balances

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

        if (studentId) {
            filtered = filtered.filter((row: any) => row.studentId === studentId)
        }

        // Transform to include student object
        const result = filtered.map((row: any) => ({
            id: row.id,
            studentId: row.studentId,
            semesterId: row.semesterId,
            month: row.month,
            year: row.year,
            balance: row.balance,
            laborDays: row.laborDays,
            provisionDays: row.provisionDays,
            laborCharge: row.laborCharge,
            provisionCharge: row.provisionCharge,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            student: {
                id: row.studentId,
                name: row.student_name,
                rollNo: row.student_roll,
            }
        }))

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching monthly balances:", error)
        return NextResponse.json({ error: "Failed to fetch monthly balances" }, { status: 500 })
    }
}

// POST: Create or update (upsert) monthly balance records
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { balances, semesterId, month, year } = body

        if (!balances || !Array.isArray(balances)) {
            return NextResponse.json({ error: "Invalid request: balances array required" }, { status: 400 })
        }

        let successCount = 0
        const now = new Date()

        for (const balance of balances) {
            const { studentId, semesterId: balSemId, month: balMonth, year: balYear, balance: balanceAmount, laborDays, provisionDays, laborCharge, provisionCharge } = balance

            if (!studentId || !balSemId || !balMonth || !balYear) {
                console.warn("Skipping invalid balance record:", balance)
                continue
            }

            const semIdNum = parseInt(balSemId)
            const monthNum = parseInt(balMonth)
            const yearNum = parseInt(balYear)

            try {
                // Check if record exists (by studentId + month + year, ignoring semester for cross-semester continuity)
                const existing = await sql`
          SELECT id FROM monthly_balances 
          WHERE "studentId" = ${studentId} 
            AND month = ${monthNum}
            AND year = ${yearNum}
        `

                if (existing.length > 0) {
                    // Update existing
                    await sql`
            UPDATE monthly_balances SET
              balance = ${balanceAmount},
              "laborDays" = ${laborDays || null},
              "provisionDays" = ${provisionDays || null},
              "laborCharge" = ${laborCharge || null},
              "provisionCharge" = ${provisionCharge || null},
              "updatedAt" = ${now}
            WHERE id = ${existing[0].id}
          `
                } else {
                    // Insert new
                    await sql`
            INSERT INTO monthly_balances ("studentId", "semesterId", month, year, balance, "laborDays", "provisionDays", "laborCharge", "provisionCharge", "createdAt", "updatedAt")
            VALUES (${studentId}, ${semIdNum}, ${monthNum}, ${yearNum}, ${balanceAmount}, ${laborDays || null}, ${provisionDays || null}, ${laborCharge || null}, ${provisionCharge || null}, ${now}, ${now})
          `
                }
                successCount++
            } catch (err) {
                console.error(`Error upserting balance for student ${studentId}:`, err)
            }
        }

        // Log the bulk update
        const currentUserId = await getCurrentUserId()
        await createAuditLog(
            currentUserId,
            "BULK_UPDATE",
            "monthlyBalance",
            `${month}_${year}`,
            null,
            {
                semesterId,
                month,
                year,
                recordsUpdated: successCount,
            }
        )

        return NextResponse.json({ success: true, updated: successCount })
    } catch (error) {
        console.error("Error updating monthly balances:", error)
        return NextResponse.json({ error: "Failed to update monthly balances" }, { status: 500 })
    }
}

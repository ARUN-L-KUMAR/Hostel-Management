import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { neon } from "@neondatabase/serverless"

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get date filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build WHERE clause for date filtering
    let whereClause = ""
    const whereConditions = []

    if (startDate) {
      whereConditions.push(`al.timestamp >= '${startDate}T00:00:00.000Z'`)
    }
    if (endDate) {
      // Add one day to end date to include the entire end date
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      whereConditions.push(`al.timestamp <= '${endDateTime.toISOString()}'`)
    }

    if (whereConditions.length > 0) {
      whereClause = `WHERE ${whereConditions.join(' AND ')}`
    }

    // Use direct SQL query to fetch audit logs with user data and date filtering
    const logsResult = await sql`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al."userId" = u.id
      ${sql.unsafe(whereClause)}
      ORDER BY al.timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Transform the results to match the expected format
    const logs = logsResult.map((log: any) => ({
      ...log,
      user: log.user_name ? {
        name: log.user_name,
        email: log.user_email
      } : null
    }))

    console.log(`[v0] Found ${logs.length} audit logs`)
    console.log(`[v0] Sample log user data:`, logs[0]?.user)
    console.log(`[v0] Sample log userId:`, logs[0]?.userId)
    console.log(`[v0] First few logs:`, logs.slice(0, 3).map((log: any) => ({ id: log.id, userId: log.userId, user: log.user })))

    // Get total count using direct SQL with date filtering
    const totalResult = await sql`SELECT COUNT(*) FROM audit_logs al ${sql.unsafe(whereClause)}`
    const total = Number.parseInt(totalResult[0].count)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, entity, entityId, oldData, newData } = body

    // Safely serialize data for storage
    const serializeData = (data: any) => {
      if (!data) return null
      try {
        // Remove any circular references and non-serializable properties
        const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
          // Handle Date objects
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() }
          }
          // Handle other special objects
          if (typeof value === 'object' && value !== null) {
            // Remove functions and other non-serializable properties
            const cleanedObj: any = {}
            for (const [k, v] of Object.entries(value)) {
              if (typeof v !== 'function' && k !== '_prisma') {
                cleanedObj[k] = v
              }
            }
            return cleanedObj
          }
          return value
        }))
        return cleaned
      } catch (error) {
        console.error('Error serializing audit data:', error)
        return { error: 'Failed to serialize data', originalType: typeof data }
      }
    }

    const log = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldData: serializeData(oldData),
        newData: serializeData(newData)
      }
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    )
  }
}
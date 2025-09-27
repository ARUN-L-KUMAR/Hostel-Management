import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hostel = searchParams.get("hostel")
    const year = searchParams.get("year")
    const isMando = searchParams.get("isMando")
    const status = searchParams.get("status")
    const dept = searchParams.get("dept")
    const search = searchParams.get("search")
    const month = searchParams.get("month")
    const attendanceYear = searchParams.get("attendanceYear")

    console.log(`[API DEBUG] Query params:`, { hostel, year, isMando, status, dept, search })

    const where: any = {}

    // Apply filters
    if (hostel && hostel !== "all") {
      where.hostel = {
        name: hostel
      }
      console.log(`[DEBUG] Hostel filter applied: ${hostel}`)
    }

    if (year && year !== "all") {
      where.year = Number.parseInt(year)
      console.log(`[DEBUG] Year filter applied: ${year}`)
    }

    if (isMando === "true") {
      where.isMando = true
    } else if (isMando === "false") {
      where.isMando = false
    }
    // If isMando is null/undefined, no filter is applied (show all students)

    if (status && status !== "all") {
      where.status = status
      console.log(`[DEBUG] Status filter applied: ${status}`)
    }

    if (dept && dept !== "all") {
      where.dept = {
        contains: dept,
        mode: 'insensitive'
      }
      console.log(`[DEBUG] Dept filter applied: ${dept}`)
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } },
        { dept: { contains: search, mode: 'insensitive' } }
      ]
      console.log(`[DEBUG] Search filter applied: ${search}`)
    }

    console.log(`[DEBUG] Final where clause:`, JSON.stringify(where, null, 2))

    console.log(`[DEBUG] About to execute Prisma query...`)

    // Include attendance if month and year are provided
    const include: any = {
      hostel: true,
    }

    if (month && attendanceYear) {
      // Create UTC dates to avoid timezone issues
      const startDate = new Date(`${attendanceYear}-${month.padStart(2, '0')}-01T00:00:00.000Z`)
      const endDate = new Date(Number.parseInt(attendanceYear), Number.parseInt(month), 0)
      endDate.setUTCHours(23, 59, 59, 999) // End of last day of month

      include.attendance = {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      }
      console.log(`[DEBUG] Attendance filter applied: ${attendanceYear}-${month} (${startDate.toISOString()} to ${endDate.toISOString()})`)
    }

    const students = await prisma.student.findMany({
      where,
      include,
      orderBy: { name: "asc" },
    })
    console.log(`[DEBUG] Prisma query completed. Result count: ${students.length}`)

    // Let's also check the actual hostel names in the results
    const hostelNames = [...new Set(students.map(s => s.hostel?.name).filter(Boolean))]
    console.log(`[DEBUG] Hostel names in results: ${JSON.stringify(hostelNames)}`)

    console.log(`[v0] Finding students with options:`, JSON.stringify({where, include, orderBy: {name: "asc"}}))
    console.log(`[v0] Found students:`, students.length)

    return NextResponse.json(students, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, rollNumber, dept, hostel, year, isMando } = body

    // Use predefined hostel IDs
    const hostelId = hostel === 'boys' ? 'hostel_boys' : 'hostel_girls'

    // Ensure hostel exists
    let hostelRecord = await prisma.hostel.findUnique({
      where: { id: hostelId }
    })

    if (!hostelRecord) {
      hostelRecord = await prisma.hostel.create({
        data: {
          id: hostelId,
          name: hostel === 'boys' ? 'Boys' : 'Girls',
          description: `${hostel === 'boys' ? 'Boys' : 'Girls'} Hostel`
        }
      })
    }

    const student = await prisma.student.create({
      data: {
        name,
        rollNo: rollNumber,
        dept: dept || null,
        gender: hostel === 'boys' ? 'M' : 'F',
        hostelId: hostelRecord.id,
        year: parseInt(year),
        isMando: isMando || false,
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

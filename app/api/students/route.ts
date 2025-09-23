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
    const search = searchParams.get("search")

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

    if (isMando && isMando !== "all") {
      where.isMando = isMando === "true"
      console.log(`[DEBUG] Mando filter applied: ${isMando}`)
    }

    if (status && status !== "all") {
      where.status = status
      console.log(`[DEBUG] Status filter applied: ${status}`)
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } }
      ]
      console.log(`[DEBUG] Search filter applied: ${search}`)
    }

    console.log(`[DEBUG] Final where clause:`, JSON.stringify(where, null, 2))

    console.log(`[DEBUG] About to execute Prisma query...`)
    
    const students = await prisma.student.findMany({
      where,
      include: {
        hostel: true,
      },
      orderBy: { name: "asc" },
    })
    console.log(`[DEBUG] Prisma query completed. Result count: ${students.length}`)
    
    // Let's also check the actual hostel names in the results
    const hostelNames = [...new Set(students.map(s => s.hostel?.name).filter(Boolean))]
    console.log(`[DEBUG] Hostel names in results: ${JSON.stringify(hostelNames)}`)

    console.log(`[v0] Finding students with options:`, JSON.stringify({where, include: {hostel: true}, orderBy: {name: "asc"}}))  
    console.log(`[v0] Found students:`, students.length)

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, rollNumber, hostel, year, isMando, mandoMultiplier } = body

    const student = await prisma.student.create({
      data: {
        name,
        rollNumber,
        hostel,
        year,
        isMando,
        mandoMultiplier: isMando ? mandoMultiplier : null,
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

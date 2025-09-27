import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch departments from students table, excluding null values
    const students = await prisma.student.findMany({
      where: {
        dept: {
          not: null
        }
      },
      select: {
        dept: true
      }
    })

    // Extract unique department values and sort them
    const deptSet = new Set(students.map(student => student.dept).filter((dept): dept is string => dept !== null))
    const deptList = Array.from(deptSet).sort()

    return NextResponse.json(deptList, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}
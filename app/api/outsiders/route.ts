import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    const outsiders = await prisma.outsider.findMany({
      where,
      include: {
        meals: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(outsiders, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching outsiders:", error)
    return NextResponse.json({ error: "Failed to fetch outsiders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, company, designation, description } = body

    const outsider = await prisma.outsider.create({
      data: {
        name,
        phone,
        company,
        designation,
        description,
      },
    })

    return NextResponse.json(outsider)
  } catch (error) {
    console.error("Error creating outsider:", error)
    return NextResponse.json({ error: "Failed to create outsider" }, { status: 500 })
  }
}
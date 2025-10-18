import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuditLog, getCurrentUserId } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)

    const reports = await prisma.savedReport.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching saved reports:', error)
    return NextResponse.json({ error: 'Failed to fetch saved reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, reportName, settings, summary } = body

    if (!month || !year || !reportName || !settings || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const report = await prisma.savedReport.create({
      data: {
        month: parseInt(month),
        year: parseInt(year),
        reportName,
        settings,
        summary,
      },
    })

    // Log the creation
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "CREATE",
      "savedReport",
      report.id,
      null,
      {
        month: parseInt(month),
        year: parseInt(year),
        reportName,
        settings,
        summary,
      }
    )

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error saving report:', error)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }
}
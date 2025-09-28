import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.savedReport.findUnique({
      where: { id: params.id },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching saved report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { reportName, settings, summary } = body

    const report = await prisma.savedReport.update({
      where: { id: params.id },
      data: {
        reportName,
        settings,
        summary,
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error updating saved report:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.savedReport.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}
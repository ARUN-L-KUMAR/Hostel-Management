import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuditLog, getCurrentUserId } from '@/lib/audit'

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

    // Get old data for audit logging
    const existingReport = await prisma.savedReport.findUnique({
      where: { id: params.id }
    })

    const report = await prisma.savedReport.update({
      where: { id: params.id },
      data: {
        reportName,
        settings,
        summary,
      },
    })

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "savedReport",
      params.id,
      existingReport ? {
        reportName: existingReport.reportName,
        settings: existingReport.settings,
        summary: existingReport.summary,
      } : null,
      {
        reportName,
        settings,
        summary,
      }
    )

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
    // Get report data before deletion for audit logging
    const reportToDelete = await prisma.savedReport.findUnique({
      where: { id: params.id }
    })

    await prisma.savedReport.delete({
      where: { id: params.id },
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "savedReport",
      params.id,
      reportToDelete ? {
        reportName: reportToDelete.reportName,
        settings: reportToDelete.settings,
        summary: reportToDelete.summary,
      } : null,
      null
    )

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}
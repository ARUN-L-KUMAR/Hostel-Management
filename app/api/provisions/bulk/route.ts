import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provisions } = body

    if (!Array.isArray(provisions)) {
      return NextResponse.json({ error: "Provisions must be an array" }, { status: 400 })
    }

    const results = {
      successfulCount: 0,
      failedCount: 0,
      warnings: [] as string[],
      errors: [] as string[]
    }

    // Process provisions in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < provisions.length; i += batchSize) {
      const batch = provisions.slice(i, i + batchSize)

      for (const provisionData of batch) {
        try {
          const { name, unit, unitCost, unitMeasure, category } = provisionData

          // Validate required fields
          if (!name) {
            results.failedCount++
            results.errors.push(`Missing name for provision: ${JSON.stringify(provisionData)}`)
            continue
          }

          // Check if provision already exists (case-insensitive)
          const existingProvisions = await prisma.provisionItem.findMany({
            where: {
              name: {
                equals: name,
                mode: 'insensitive'
              }
            },
            take: 1
          })
          const existingProvision = existingProvisions[0]

          if (existingProvision) {
            results.failedCount++
            results.warnings.push(`Provision "${name}" already exists`)
            continue
          }

          // Create the provision
          await prisma.provisionItem.create({
            data: {
              name: name.trim(),
              unit: unit || 'kg',
              unitCost: unitCost || 0,
              unitMeasure: unitMeasure || `1 ${unit || 'kg'}`,
              category: category || 'GENERAL'
            }
          })

          results.successfulCount++
        } catch (error) {
          console.error('Error creating provision:', error)
          results.failedCount++
          results.errors.push(`Failed to create provision "${provisionData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    const message = results.successfulCount > 0
      ? `Successfully imported ${results.successfulCount} provisions${results.failedCount > 0 ? `, ${results.failedCount} failed` : ''}`
      : 'No provisions were imported'

    return NextResponse.json({
      message,
      successfulCount: results.successfulCount,
      failedCount: results.failedCount,
      warnings: results.warnings,
      errors: results.errors
    })

  } catch (error) {
    console.error("Error in bulk provision import:", error)
    return NextResponse.json({ error: "Failed to import provisions" }, { status: 500 })
  }
}
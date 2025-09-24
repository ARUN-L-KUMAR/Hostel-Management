import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let query = sql`
      SELECT
        pp.id,
        pp.date,
        pp.vendor,
        pp."paymentType",
        pp."billId",
        pp."totalAmount",
        pp."createdAt",
        json_agg(
          json_build_object(
            'id', ppi.id,
            'quantity', ppi.quantity,
            'unitCost', ppi."unitCost",
            'total', ppi.total,
            'provisionItem', json_build_object(
              'id', pi.id,
              'name', pi.name,
              'unit', pi.unit,
              'unitCost', pi."unitCost"
            )
          )
        ) as items
      FROM provision_purchases pp
      LEFT JOIN provision_purchase_items ppi ON pp.id = ppi."provisionPurchaseId"
      LEFT JOIN provision_items pi ON ppi."provisionItemId" = pi.id
    `

    // Filter by year and month if provided
    if (year && month) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      const endDateStr = endDate.toISOString().split('T')[0]

      query = sql`${query} WHERE pp.date >= ${startDate} AND pp.date <= ${endDateStr}`
    }

    query = sql`${query} GROUP BY pp.id, pp.date, pp.vendor, pp."paymentType", pp."billId", pp."totalAmount", pp."createdAt" ORDER BY pp.date DESC`

    const purchases = await query
    console.log("Purchases query result:", purchases)

    return NextResponse.json(purchases)
  } catch (error) {
    console.error("Error fetching provision purchases:", error)
    return NextResponse.json({ error: "Failed to fetch provision purchases" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, vendor, paymentType, billId, items } = body

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.total), 0)

    // Generate ID for purchase
    const purchaseId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert purchase
    await sql`
      INSERT INTO provision_purchases (id, date, vendor, "paymentType", "billId", "totalAmount", "createdAt", "updatedAt")
      VALUES (${purchaseId}, ${new Date(date).toISOString().split('T')[0]}, ${vendor}, ${paymentType}, ${billId || null}, ${totalAmount}, NOW(), NOW())
    `

    // Insert purchase items
    for (const item of items) {
      const itemId = `ppi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await sql`
        INSERT INTO provision_purchase_items (id, "provisionPurchaseId", "provisionItemId", quantity, "unitCost", total, "createdAt", "updatedAt")
        VALUES (${itemId}, ${purchaseId}, ${item.provisionItemId}, ${item.quantity}, ${item.unitCost}, ${item.total}, NOW(), NOW())
      `
    }

    // Fetch the created purchase with items
    const purchase = await sql`
      SELECT
        pp.id,
        pp.date,
        pp.vendor,
        pp."paymentType",
        pp."billId",
        pp."totalAmount",
        pp."createdAt",
        json_agg(
          json_build_object(
            'id', ppi.id,
            'quantity', ppi.quantity,
            'unitCost', ppi."unitCost",
            'total', ppi.total,
            'provisionItem', json_build_object(
              'id', pi.id,
              'name', pi.name,
              'unit', pi.unit,
              'unitCost', pi."unitCost"
            )
          )
        ) as items
      FROM provision_purchases pp
      LEFT JOIN provision_purchase_items ppi ON pp.id = ppi."provisionPurchaseId"
      LEFT JOIN provision_items pi ON ppi."provisionItemId" = pi.id
      WHERE pp.id = ${purchaseId}
      GROUP BY pp.id, pp.date, pp.vendor, pp."paymentType", pp."billId", pp."totalAmount", pp."createdAt"
    `

    return NextResponse.json(purchase[0])
  } catch (error) {
    console.error("Error creating provision purchase:", error)
    return NextResponse.json({ error: "Failed to create provision purchase" }, { status: 500 })
  }
}
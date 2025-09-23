import { type NextRequest, NextResponse } from "next/server"
import { calculateBilling } from "@/lib/calculations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, carryForward = 0, advanceReceived = 0 } = body

    const billing = await calculateBilling(month, year, carryForward, advanceReceived)

    return NextResponse.json(billing)
  } catch (error) {
    console.error("Error calculating billing:", error)
    return NextResponse.json({ error: "Failed to calculate billing" }, { status: 500 })
  }
}

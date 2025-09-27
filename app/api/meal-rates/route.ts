import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/meal-rates - Fetching meal rates...')
    const mandoSettings = await prisma.mandoSettings.findFirst({
      where: { id: "default" }
    })

    console.log('Raw mando settings from DB:', mandoSettings)
    console.log('mandoSettings.perMealRate:', mandoSettings?.perMealRate, 'type:', typeof mandoSettings?.perMealRate)
    console.log('mandoSettings.outsiderMealRate:', mandoSettings?.outsiderMealRate, 'type:', typeof mandoSettings?.outsiderMealRate)

    if (!mandoSettings) {
      console.log('No settings found, returning defaults')
      return NextResponse.json({
        mando: 50,
        outsiders: 50
      })
    }

    const result = {
      mando: Number(mandoSettings.perMealRate),
      outsiders: Number(mandoSettings.outsiderMealRate)
    }

    console.log('Final result being returned:', result)
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching meal rates:", error)
    return NextResponse.json({ error: "Failed to fetch meal rates" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { mando, outsiders } = body

    console.log('Updating meal rates - mando:', mando, 'outsiders:', outsiders)
    console.log('Request body:', body)

    // First try to find existing settings
    console.log('Looking for existing settings with id: default')
    const existingSettings = await prisma.mandoSettings.findFirst({
      where: { id: "default" }
    })

    console.log('Existing settings found:', existingSettings)
    console.log('Existing settings type:', typeof existingSettings)
    console.log('Existing settings isActive:', existingSettings?.isActive)

    let updatedSettings
    if (existingSettings) {
      // Update existing
      console.log('Updating existing settings')
      try {
        updatedSettings = await prisma.mandoSettings.update({
          where: { id: existingSettings.id },
          data: {
            perMealRate: mando,
            outsiderMealRate: outsiders
          }
        })
        console.log('Update successful, updatedSettings:', updatedSettings)
      } catch (updateError) {
        console.error('Error updating settings:', updateError)
        throw updateError
      }
    } else {
      // Create new
      console.log('Creating new settings')
      try {
        updatedSettings = await prisma.mandoSettings.create({
          data: {
            id: "default",
            perMealRate: mando,
            outsiderMealRate: outsiders
          }
        })
        console.log('Create successful, updatedSettings:', updatedSettings)
      } catch (createError) {
        console.error('Error creating settings:', createError)
        throw createError
      }
    }

    console.log('Updated settings:', updatedSettings)

    return NextResponse.json({
      mando: Number(updatedSettings.perMealRate),
      outsiders: Number(updatedSettings.outsiderMealRate)
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error updating meal rates:", error)
    return NextResponse.json({ error: "Failed to update meal rates" }, { status: 500 })
  }
}
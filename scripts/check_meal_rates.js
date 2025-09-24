const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMealRates() {
  try {
    console.log('Checking current meal rates in database...')

    const settings = await prisma.mandoSettings.findMany()

    console.log(`Found ${settings.length} mando settings records:`)

    settings.forEach(setting => {
      console.log(`- ID: ${setting.id}`)
      console.log(`  perMealRate: ${setting.perMealRate}`)
      console.log(`  outsiderMealRate: ${setting.outsiderMealRate}`)
      console.log(`  isActive: ${setting.isActive}`)
      console.log(`  createdAt: ${setting.createdAt}`)
      console.log(`  updatedAt: ${setting.updatedAt}`)
      console.log('---')
    })

    if (settings.length === 0) {
      console.log('No settings found. Creating default settings...')

      const newSettings = await prisma.mandoSettings.create({
        data: {
          id: "default",
          perMealRate: 50,
          outsiderMealRate: 50
        }
      })

      console.log('Created default settings:', newSettings)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMealRates()
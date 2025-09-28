const { neon } = require('@neondatabase/serverless')

async function makeColumnsNullable() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Making old columns nullable...')
    await sql`ALTER TABLE saved_reports ALTER COLUMN "reportData" DROP NOT NULL;`
    await sql`ALTER TABLE saved_reports ALTER COLUMN "totalExpenses" DROP NOT NULL;`
    await sql`ALTER TABLE saved_reports ALTER COLUMN "totalIncomes" DROP NOT NULL;`
    await sql`ALTER TABLE saved_reports ALTER COLUMN "netProfit" DROP NOT NULL;`

    console.log('Old columns made nullable successfully!')
  } catch (error) {
    console.error('Failed to make columns nullable:', error)
    process.exit(1)
  }
}

makeColumnsNullable()
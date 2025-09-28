const { neon } = require('@neondatabase/serverless')

async function addColumns() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Adding settings column...')
    await sql`ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "settings" JSONB;`

    console.log('Adding summary column...')
    await sql`ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "summary" JSONB;`

    console.log('Columns added successfully!')
  } catch (error) {
    console.error('Failed to add columns:', error)
    process.exit(1)
  }
}

addColumns()
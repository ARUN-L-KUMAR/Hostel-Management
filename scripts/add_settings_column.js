const { neon } = require('@neondatabase/serverless')

async function addSettingsColumn() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Adding settings column...')
    await sql.unsafe('ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "settings" JSONB;')
    console.log('Settings column added successfully!')
  } catch (error) {
    console.error('Failed to add settings column:', error)
    process.exit(1)
  }
}

addSettingsColumn()
const { neon } = require('@neondatabase/serverless')

async function checkColumns() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'saved_reports' AND table_schema = 'public';`
    console.log('Columns in saved_reports table:', result.map(r => r.column_name))
  } catch (error) {
    console.error('Failed to check columns:', error)
    process.exit(1)
  }
}

checkColumns()
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Starting migration...')

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate_saved_reports.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('Found', statements.length, 'statements:')
    statements.forEach((stmt, i) => console.log(`${i + 1}: ${stmt.substring(0, 50)}...`))

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...')
        await sql.unsafe(statement)
      }
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
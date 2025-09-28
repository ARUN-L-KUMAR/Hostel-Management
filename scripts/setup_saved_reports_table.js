const { neon } = require('@neondatabase/serverless')
require('dotenv').config()

const sql = neon(process.env.DATABASE_URL)

async function createSavedReportsTable() {
  try {
    console.log('Creating saved_reports table...')

    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS saved_reports (
        id TEXT PRIMARY KEY,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        "reportName" TEXT NOT NULL,
        "reportData" JSONB NOT NULL,
        "totalExpenses" DECIMAL(10,2) DEFAULT 0,
        "totalIncomes" DECIMAL(10,2) DEFAULT 0,
        "netProfit" DECIMAL(10,2) DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_reports_month_year ON saved_reports(month, year)`
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_reports_created_at ON saved_reports("createdAt" DESC)`

    console.log('✅ saved_reports table created successfully!')
  } catch (error) {
    console.error('❌ Error creating saved_reports table:', error)
    process.exit(1)
  }
}

createSavedReportsTable()
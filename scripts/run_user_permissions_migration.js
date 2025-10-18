const { neon } = require("@neondatabase/serverless")
require('dotenv').config()

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Running user permissions migration...')

    // Add permissions column
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "permissions" JSONB`
    console.log('✅ Added permissions column')

    // Add comment
    await sql`COMMENT ON COLUMN users.permissions IS 'Array of page permissions like ["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports", "admin"]'`
    console.log('✅ Added column comment')

    // Update existing ADMIN users
    const adminResult = await sql`UPDATE users SET permissions = '["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports", "admin"]' WHERE role = 'ADMIN'`
    console.log(`✅ Updated ${adminResult.length} ADMIN users with full permissions`)

    // Update existing MANAGER users
    const managerResult = await sql`UPDATE users SET permissions = '["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports"]' WHERE role = 'MANAGER' AND (permissions IS NULL OR permissions = '[]'::jsonb)`
    console.log(`✅ Updated ${managerResult.length} MANAGER users with default permissions`)

    // Show current users and their permissions
    const users = await sql`SELECT id, name, email, role, permissions FROM users ORDER BY name`
    console.log('\n📋 Current users and permissions:')
    users.forEach(user => {
      console.log(`${user.name} (${user.email}) - ${user.role}: ${JSON.stringify(user.permissions)}`)
    })

    console.log('\n🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
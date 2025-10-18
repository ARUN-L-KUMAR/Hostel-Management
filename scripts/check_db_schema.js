const { neon } = require("@neondatabase/serverless")
require('dotenv').config()

async function checkSchema() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Checking current database schema...')

    // Check if permissions column exists in users table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    console.log('\n📋 Users table columns:')
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'} ${col.column_default ? `(default: ${col.column_default})` : ''}`)
    })

    // Check if permissions column exists
    const permissionsCol = columns.find(col => col.column_name === 'permissions')
    if (permissionsCol) {
      console.log('\n✅ Permissions column exists:', permissionsCol)
    } else {
      console.log('\n❌ Permissions column does NOT exist')

      // Try to add it directly
      console.log('\n🔧 Attempting to add permissions column...')
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "permissions" JSONB`
        console.log('✅ Successfully added permissions column')

        // Verify it was added
        const updatedColumns = await sql`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'permissions'
        `
        console.log('✅ Verified permissions column:', updatedColumns[0])

      } catch (error) {
        console.error('❌ Failed to add permissions column:', error)
      }
    }

    // Check current users and their permissions
    const users = await sql`SELECT id, name, email, role, permissions FROM users ORDER BY name`
    console.log('\n👥 Current users and permissions:')
    users.forEach(user => {
      console.log(`${user.name} (${user.email}) - ${user.role}: ${user.permissions || 'No permissions set'}`)
    })

  } catch (error) {
    console.error('❌ Error checking schema:', error)
  }
}

checkSchema()
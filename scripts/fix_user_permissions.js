const { neon } = require("@neondatabase/serverless")
require('dotenv').config()

async function fixUserPermissions() {
  const sql = neon(process.env.DATABASE_URL)

  try {
    console.log('Fixing user permissions...')

    // Set default permissions for users that don't have any
    const usersWithoutPermissions = await sql`
      SELECT id, name, email, role FROM users
      WHERE permissions IS NULL OR permissions = '[]'::jsonb
    `

    console.log(`Found ${usersWithoutPermissions.length} users without permissions`)

    for (const user of usersWithoutPermissions) {
      let defaultPermissions

      if (user.role === 'ADMIN') {
        defaultPermissions = '["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports", "admin"]'
      } else {
        defaultPermissions = '["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports"]'
      }

      await sql`
        UPDATE users SET permissions = ${defaultPermissions}
        WHERE id = ${user.id}
      `

      console.log(`✅ Updated ${user.name} (${user.role}) with default permissions`)
    }

    // Show final state
    const finalUsers = await sql`SELECT id, name, email, role, permissions FROM users ORDER BY name`
    console.log('\n📋 Final user permissions:')
    finalUsers.forEach(user => {
      const perms = Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions || '[]')
      console.log(`${user.name} (${user.email}) - ${user.role}: [${perms.join(', ')}]`)
    })

    console.log('\n🎉 All users now have proper permissions!')

  } catch (error) {
    console.error('❌ Error fixing permissions:', error)
  }
}

fixUserPermissions()
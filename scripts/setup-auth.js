require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Setting up authentication...');
    
    // Add password column if it doesn't exist
    try {
      await sql`ALTER TABLE users ADD COLUMN password VARCHAR(255)`;
      console.log('✅ Added password column to users table');
    } catch (error) {
      if (error.code === '42701') { // Column already exists
        console.log('ℹ️ Password column already exists');
      } else {
        throw error;
      }
    }
    
    // Create admin user with password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    try {
      await sql`
        INSERT INTO users (id, name, email, role, password, "createdAt", "updatedAt") 
        VALUES (
          'admin_user', 
          'System Administrator', 
          'admin@hostel.edu', 
          'ADMIN', 
          ${hashedPassword},
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Created admin user: admin@hostel.edu / admin123');
    } catch (error) {
      if (error.code === '23505') { // User already exists
        // Update existing user with password
        await sql`
          UPDATE users 
          SET password = ${hashedPassword}
          WHERE email = 'admin@hostel.edu'
        `;
        console.log('✅ Updated existing admin user with password');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Authentication setup complete!');
    console.log('📧 Email: admin@hostel.edu');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  setupDatabase();
} else {
  console.log('⚠️ DATABASE_URL not found. Make sure to set your environment variables.');
}
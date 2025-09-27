require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkUser() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Checking if user exists...');
    
    // Check if the user exists
    const result = await sql`
      SELECT id, email, name, role FROM users WHERE email = 'arunkumar582004@gmail.com'
    `;
    
    if (result.length > 0) {
      console.log('User found:');
      console.log(result[0]);
    } else {
      console.log('User not found in database');
    }
    
    // Also check all users
    console.log('\nAll users in database:');
    const allUsers = await sql`
      SELECT id, email, name, role FROM users
    `;
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`);
    });
    
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkUser();
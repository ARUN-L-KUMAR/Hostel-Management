require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Resetting password for arunkumar582004@gmail.com...');
    
    // Hash the new password
    const newPassword = 'Arunkumar@58';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    const result = await sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'arunkumar582004@gmail.com'
    `;
    
    console.log('Password updated successfully!');
    console.log('You can now log in with:');
    console.log('Email: arunkumar582004@gmail.com');
    console.log('Password: Arunkumar@58');
    
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

resetPassword();
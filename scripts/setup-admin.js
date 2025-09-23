const bcrypt = require('bcryptjs');

async function setupAdmin() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('Default Admin Setup:');
  console.log('Email: admin@hostel.edu');
  console.log('Password:', password);
  console.log('Hashed Password:', hashedPassword);
  console.log('\nUse these credentials to sign in to the system.');
  
  // You can also make an API call to create the user
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'System Administrator',
        email: 'admin@hostel.edu',
        role: 'ADMIN',
        password: password
      })
    });
    
    if (response.ok) {
      console.log('✅ Admin user created successfully!');
    } else {
      const error = await response.json();
      console.log('⚠️ User might already exist:', error.error);
    }
  } catch (error) {
    console.log('Note: Run this after starting the server to create the admin user automatically.');
  }
}

setupAdmin();
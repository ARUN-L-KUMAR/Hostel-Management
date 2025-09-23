-- Add password column to users table
ALTER TABLE users ADD COLUMN password VARCHAR(255);

-- Update existing admin user with hashed password
-- Password: admin123
UPDATE users 
SET password = '$2b$12$h9ncjDclJhazUp0Dxemj.O5jNQeSYC3WIpRHQm1iZOVHJgM7e6p8K' 
WHERE email = 'admin@hostel.edu';

-- If admin user doesn't exist, create one
INSERT INTO users (id, name, email, role, password, "createdAt", "updatedAt") 
SELECT 
  'admin_user', 
  'System Administrator', 
  'admin@hostel.edu', 
  'ADMIN', 
  '$2b$12$h9ncjDclJhazUp0Dxemj.O5jNQeSYC3WIpRHQm1iZOVHJgM7e6p8K',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@hostel.edu');
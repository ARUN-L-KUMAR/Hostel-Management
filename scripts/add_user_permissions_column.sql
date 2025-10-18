-- Add permissions column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "permissions" JSONB;

-- Add comment to explain the permissions structure
COMMENT ON COLUMN users.permissions IS 'Array of page permissions like ["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports", "admin"]';

-- Update existing ADMIN users to have all permissions by default
UPDATE users
SET permissions = '["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports", "admin"]'
WHERE role = 'ADMIN';

-- Update existing MANAGER users to have default permissions (excluding admin)
UPDATE users
SET permissions = '["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports"]'
WHERE role = 'MANAGER' AND (permissions IS NULL OR permissions = '[]'::jsonb);
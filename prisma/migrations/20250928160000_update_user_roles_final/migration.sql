-- Since PostgreSQL doesn't allow direct modification of ENUM types in a simple way,
-- we need to update the data first, then change the column type.

-- Step 1: First, drop the default value
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Update any existing records with old roles to the new roles
-- First, let's just update the data to use the new role values
-- For ACCOUNTANT and VIEWER roles, we'll convert them to MESS_MANAGER (which we'll treat as MANAGER in the UI)
-- For MESS_MANAGER role, we'll keep it as is for now
UPDATE "public"."users" 
SET "role" = 'MESS_MANAGER'
WHERE "role" IN ('ACCOUNTANT', 'VIEWER');

-- Step 3: Create the new enum type
CREATE TYPE "public"."UserRole_new" AS ENUM ('ADMIN', 'MANAGER');

-- Step 4: Alter the users table to use the new enum type
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");

-- Step 5: Set the new default value
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'MANAGER';

-- Step 6: Drop the old enum type
DROP TYPE "public"."UserRole";

-- Step 7: Rename the new enum type to the original name
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
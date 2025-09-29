-- Add memberCount column to outsider_meal_records table
-- Run this script manually in your database

ALTER TABLE outsider_meal_records
ADD COLUMN IF NOT EXISTS "memberCount" INTEGER DEFAULT 1;

-- Update existing records to have memberCount = 1 if they are NULL
UPDATE outsider_meal_records
SET "memberCount" = 1
WHERE "memberCount" IS NULL;
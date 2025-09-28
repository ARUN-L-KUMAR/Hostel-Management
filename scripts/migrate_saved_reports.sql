-- Migration script to update saved_reports table schema
-- This script changes the table to use 'settings' and 'summary' columns instead of 'reportData', 'totalExpenses', 'totalIncomes', 'netProfit'

-- First, add the new columns
ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "settings" JSONB;

ALTER TABLE saved_reports ADD COLUMN IF NOT EXISTS "summary" JSONB;

-- Migrate existing data from old columns to new structure
UPDATE saved_reports SET "settings" = jsonb_build_object('labourCharge', COALESCE("reportData"->>'labourCharge', '0')::numeric, 'outsiderRate', COALESCE("reportData"->>'outsiderRate', '50')::numeric, 'mandoRate', COALESCE("reportData"->>'mandoRate', '50')::numeric, 'bankInterestRate', COALESCE("reportData"->>'bankInterestRate', '2.5')::numeric, 'externalIncomes', COALESCE("reportData"->'externalIncomes', '[]'::jsonb), 'selectedSemesterId', "reportData"->>'selectedSemesterId', 'selectedSemester', "reportData"->'selectedSemester'), "summary" = jsonb_build_object('totalExpenses', "totalExpenses", 'totalIncomes', "totalIncomes", 'netProfit', "netProfit") WHERE "settings" IS NULL;

-- Drop the old columns (optional - you can keep them for backward compatibility)
-- ALTER TABLE saved_reports DROP COLUMN IF EXISTS "reportData";
-- ALTER TABLE saved_reports DROP COLUMN IF EXISTS "totalExpenses";
-- ALTER TABLE saved_reports DROP COLUMN IF EXISTS "totalIncomes";
-- ALTER TABLE saved_reports DROP COLUMN IF EXISTS "netProfit";
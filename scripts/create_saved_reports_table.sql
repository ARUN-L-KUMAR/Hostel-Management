-- Create saved_reports table for storing monthly financial reports
CREATE TABLE IF NOT EXISTS saved_reports (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "reportName" TEXT NOT NULL,
    "settings" JSONB NOT NULL, -- User-configured settings only
    "summary" JSONB NOT NULL,  -- Calculated totals for reference
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_reports_month_year ON saved_reports(month, year);
CREATE INDEX IF NOT EXISTS idx_saved_reports_created_at ON saved_reports("createdAt" DESC);
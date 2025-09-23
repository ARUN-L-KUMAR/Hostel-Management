-- Updated to work with the new schema structure
-- Initial data setup for hostel mess management
-- This script should be run after 000_create_schema.sql

-- Verify tables exist before inserting data
DO $$
BEGIN
    -- Check if core tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        RAISE EXCEPTION 'Schema not created. Please run 000_create_schema.sql first.';
    END IF;
END $$;

-- Additional initial data can be added here if needed
-- The core configuration data is already inserted in the schema creation script

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'Initial setup completed successfully';
END $$;

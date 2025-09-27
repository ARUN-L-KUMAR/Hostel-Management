-- Add dept column to students table
-- This SQL command will add the missing department column to the students table

ALTER TABLE students ADD COLUMN dept VARCHAR(255);

-- Optionally, you can add some sample data to test
-- UPDATE students SET dept = 'CSE' WHERE id LIKE '%1758627811%';
-- UPDATE students SET dept = 'ECE' WHERE id LIKE '%1758627815%';
-- UPDATE students SET dept = 'EEE' WHERE id LIKE '%1758627810%';
-- UPDATE students SET dept = 'MECH' WHERE id LIKE '%1758627814%';
-- UPDATE students SET dept = 'CSE(CS)' WHERE id LIKE '%1758627813%';
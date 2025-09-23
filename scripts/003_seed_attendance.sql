-- Seed attendance data for current month (December 2024)
-- Creates realistic attendance patterns with different codes

-- Function to generate attendance for a student for the month
DO $$
DECLARE
    student_record RECORD;
    day_date DATE;
    attendance_code TEXT;
    random_val FLOAT;
BEGIN
    -- Loop through all students
    FOR student_record IN SELECT id, roll_no FROM students LOOP
        -- Generate attendance for each day of December 2024
        FOR day_num IN 1..31 LOOP
            day_date := ('2024-12-' || LPAD(day_num::TEXT, 2, '0'))::DATE;
            
            -- Skip if date doesn't exist (like Dec 32)
            CONTINUE WHEN day_date > '2024-12-31'::DATE;
            
            -- Generate random attendance pattern
            random_val := RANDOM();
            
            -- Attendance probability: 85% Present, 8% Leave, 4% Concession, 2% Vacation, 1% Closed
            IF random_val < 0.85 THEN
                attendance_code := 'P';
            ELSIF random_val < 0.93 THEN
                attendance_code := 'L';
            ELSIF random_val < 0.97 THEN
                attendance_code := 'CN';
            ELSIF random_val < 0.99 THEN
                attendance_code := 'V';
            ELSE
                attendance_code := 'C';
            END IF;
            
            -- Insert attendance record
            INSERT INTO attendance (id, student_id, date, code) 
            VALUES (
                'att_' || student_record.id || '_' || TO_CHAR(day_date, 'YYYY_MM_DD'),
                student_record.id,
                day_date,
                attendance_code::attendance_code
            ) ON CONFLICT (student_id, date) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

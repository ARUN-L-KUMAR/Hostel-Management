-- Database setup script that can be run directly via psql or database client
-- This is a comprehensive setup script that includes schema and seed data

-- Create database (run this separately if needed)
-- CREATE DATABASE hostel_mess_db;

-- Connect to the database and run the following:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS student_bills CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS provision_usage CASCADE;
DROP TABLE IF EXISTS provision_items CASCADE;
DROP TABLE IF EXISTS inmate_month_summary CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS hostels CASCADE;
DROP TABLE IF EXISTS billing_settings CASCADE;
DROP TABLE IF EXISTS mando_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('ADMIN', 'ACCOUNTANT', 'MESS_MANAGER', 'VIEWER');
CREATE TYPE student_status AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED');
CREATE TYPE attendance_code AS ENUM ('P', 'L', 'CN', 'V', 'C');
CREATE TYPE expense_type AS ENUM ('LABOUR', 'PROVISION', 'MAINTENANCE', 'UTILITY', 'OTHER');
CREATE TYPE bill_status AS ENUM ('DRAFT', 'PUBLISHED', 'FINALIZED');
CREATE TYPE student_bill_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
CREATE TYPE leave_policy AS ENUM ('CHARGED', 'NOT_CHARGED');

-- Create core tables
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('user_' || uuid_generate_v4()),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'VIEWER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hostels (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('hostel_' || uuid_generate_v4()),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mando_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('mando_' || uuid_generate_v4()),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 70250,
    boys_amount DECIMAL(10,2) NOT NULL DEFAULT 58200,
    girls_amount DECIMAL(10,2) NOT NULL DEFAULT 12052,
    per_meal_rate DECIMAL(10,2) NOT NULL DEFAULT 50,
    meals_per_day INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE billing_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('billing_' || uuid_generate_v4()),
    leave_policy leave_policy DEFAULT 'CHARGED',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('std_' || uuid_generate_v4()),
    name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    is_mando BOOLEAN DEFAULT FALSE,
    company VARCHAR(255),
    status student_status DEFAULT 'ACTIVE',
    hostel_id VARCHAR(50) NOT NULL,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hostel_id) REFERENCES hostels(id)
);

CREATE TABLE attendance (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('att_' || uuid_generate_v4()),
    student_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    code attendance_code NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(student_id, date)
);

CREATE TABLE inmate_month_summary (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('ims_' || uuid_generate_v4()),
    student_id VARCHAR(50) NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    enrolled BOOLEAN DEFAULT TRUE,
    staying_days INTEGER DEFAULT 0,
    total_days INTEGER DEFAULT 0,
    mandays_counted INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(student_id, month)
);

CREATE TABLE provision_items (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('prov_' || uuid_generate_v4()),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    unit_measure VARCHAR(50) DEFAULT '1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE provision_usage (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('usage_' || uuid_generate_v4()),
    provision_item_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provision_item_id) REFERENCES provision_items(id)
);

CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('bill_' || uuid_generate_v4()),
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    year INTEGER NOT NULL,
    total_mandays INTEGER NOT NULL DEFAULT 0,
    per_day_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    gross_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    adjustments DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status bill_status DEFAULT 'DRAFT',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month)
);

CREATE TABLE student_bills (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('sbill_' || uuid_generate_v4()),
    bill_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    mandays INTEGER NOT NULL,
    per_day_rate DECIMAL(10,2) NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    adjustments DECIMAL(10,2) DEFAULT 0,
    carry_forward_applied DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status student_bill_status DEFAULT 'UNPAID',
    is_mando_covered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(bill_id, student_id)
);

CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('audit_' || uuid_generate_v4()),
    user_id VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_students_hostel_id ON students(hostel_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_year ON students(year);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_inmate_summary_student_id ON inmate_month_summary(student_id);
CREATE INDEX idx_inmate_summary_month ON inmate_month_summary(month);
CREATE INDEX idx_provision_usage_item_id ON provision_usage(provision_item_id);
CREATE INDEX idx_provision_usage_date ON provision_usage(date);
CREATE INDEX idx_student_bills_bill_id ON student_bills(bill_id);
CREATE INDEX idx_student_bills_student_id ON student_bills(student_id);
CREATE INDEX idx_bills_month_year ON bills(month, year);
CREATE INDEX idx_bills_status ON bills(status);

-- Insert initial configuration data
INSERT INTO hostels (id, name, description) VALUES 
  ('hostel_boys', 'Boys', 'Boys Hostel'),
  ('hostel_girls', 'Girls', 'Girls Hostel');

INSERT INTO billing_settings (id, leave_policy, is_active) VALUES 
  ('default_billing', 'CHARGED', true);

INSERT INTO mando_settings (id, total_amount, boys_amount, girls_amount, per_meal_rate, meals_per_day, is_active) VALUES 
  ('default_mando', 70250, 58200, 12052, 50, 2, true);

INSERT INTO users (id, email, name, role) VALUES 
  ('admin_user', 'admin@hostel.edu', 'System Administrator', 'ADMIN');

-- Now insert the student data
-- Boys Hostel Students (40 students total)
-- Year 2021 (12 students, 4 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date) VALUES 
  ('std_b21_001', 'Arjun Kumar Singh', 'B21001', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-15'),
  ('std_b21_002', 'Rahul Sharma', 'B21002', 2021, true, 'TechCorp Solutions', 'ACTIVE', 'hostel_boys', '2021-07-15'),
  ('std_b21_003', 'Vikram Singh Rathore', 'B21003', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-20'),
  ('std_b21_004', 'Amit Patel', 'B21004', 2021, true, 'Infosys Limited', 'ACTIVE', 'hostel_boys', '2021-07-18'),
  ('std_b21_005', 'Suresh Reddy', 'B21005', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-22'),
  ('std_b21_006', 'Kiran Joshi', 'B21006', 2021, true, 'Wipro Technologies', 'ACTIVE', 'hostel_boys', '2021-07-25'),
  ('std_b21_007', 'Deepak Gupta', 'B21007', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-19'),
  ('std_b21_008', 'Rajesh Kumar', 'B21008', 2021, true, 'Tata Consultancy Services', 'ACTIVE', 'hostel_boys', '2021-07-16'),
  ('std_b21_009', 'Manoj Verma', 'B21009', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-21'),
  ('std_b21_010', 'Sanjay Yadav', 'B21010', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-23'),
  ('std_b21_011', 'Ravi Agarwal', 'B21011', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-17'),
  ('std_b21_012', 'Ashok Mishra', 'B21012', 2021, false, null, 'ACTIVE', 'hostel_boys', '2021-07-24');

-- Year 2022 (14 students, 5 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date) VALUES 
  ('std_b22_001', 'Naveen Kumar', 'B22001', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-15'),
  ('std_b22_002', 'Pradeep Singh', 'B22002', 2022, true, 'Microsoft Corporation', 'ACTIVE', 'hostel_boys', '2022-07-18'),
  ('std_b22_003', 'Santosh Jain', 'B22003', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-20'),
  ('std_b22_004', 'Mukesh Sharma', 'B22004', 2022, true, 'Google India', 'ACTIVE', 'hostel_boys', '2022-07-16'),
  ('std_b22_005', 'Dinesh Patel', 'B22005', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-22'),
  ('std_b22_006', 'Ramesh Gupta', 'B22006', 2022, true, 'Amazon Development Centre', 'ACTIVE', 'hostel_boys', '2022-07-19'),
  ('std_b22_007', 'Sunil Kumar', 'B22007', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-25'),
  ('std_b22_008', 'Ajay Singh', 'B22008', 2022, true, 'IBM India', 'ACTIVE', 'hostel_boys', '2022-07-17'),
  ('std_b22_009', 'Vijay Sharma', 'B22009', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-21'),
  ('std_b22_010', 'Anil Patel', 'B22010', 2022, true, 'Accenture Solutions', 'ACTIVE', 'hostel_boys', '2022-07-23'),
  ('std_b22_011', 'Rohit Gupta', 'B22011', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-24'),
  ('std_b22_012', 'Sachin Kumar', 'B22012', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-26'),
  ('std_b22_013', 'Nitin Singh', 'B22013', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-18'),
  ('std_b22_014', 'Gaurav Sharma', 'B22014', 2022, false, null, 'ACTIVE', 'hostel_boys', '2022-07-20');

-- Year 2023 (14 students, 3 mando) 
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date) VALUES 
  ('std_b23_001', 'Harsh Patel', 'B23001', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-15'),
  ('std_b23_002', 'Yash Gupta', 'B23002', 2023, true, 'Oracle Corporation', 'ACTIVE', 'hostel_boys', '2023-07-18'),
  ('std_b23_003', 'Akash Kumar', 'B23003', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-20'),
  ('std_b23_004', 'Varun Singh', 'B23004', 2023, true, 'Capgemini India', 'ACTIVE', 'hostel_boys', '2023-07-16'),
  ('std_b23_005', 'Karan Joshi', 'B23005', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-22'),
  ('std_b23_006', 'Aryan Agarwal', 'B23006', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-19'),
  ('std_b23_007', 'Rohan Verma', 'B23007', 2023, true, 'Cognizant Technology Solutions', 'ACTIVE', 'hostel_boys', '2023-07-25'),
  ('std_b23_008', 'Ishaan Yadav', 'B23008', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-17'),
  ('std_b23_009', 'Kartik Mishra', 'B23009', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-21'),
  ('std_b23_010', 'Shubham Jain', 'B23010', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-23'),
  ('std_b23_011', 'Tushar Sharma', 'B23011', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-24'),
  ('std_b23_012', 'Ankit Patel', 'B23012', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-26'),
  ('std_b23_013', 'Rishabh Gupta', 'B23013', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-18'),
  ('std_b23_014', 'Ayush Kumar', 'B23014', 2023, false, null, 'ACTIVE', 'hostel_boys', '2023-07-20');

-- Girls Hostel Students (25 students total)
-- Year 2021 (8 students, 3 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date) VALUES 
  ('std_g21_001', 'Priya Sharma', 'G21001', 2021, false, null, 'ACTIVE', 'hostel_girls', '2021-07-15'),
  ('std_g21_002', 'Sneha Patel', 'G21002', 2021, true, 'TechCorp Solutions', 'ACTIVE', 'hostel_girls', '2021-07-18'),
  ('std_g21_003', 'Pooja Singh', 'G21003', 2021, false, null, 'ACTIVE', 'hostel_girls', '2021-07-20'),
  ('std_g21_004', 'Kavya Reddy', 'G21004', 2021, true, 'Infosys Limited', 'ACTIVE', 'hostel_girls', '2021-07-16'),
  ('std_g21_005', 'Anita Kumar', 'G21005', 2021, false, null, 'ACTIVE', 'hostel_girls', '2021-07-22'),
  ('std_g21_006', 'Ritu Gupta', 'G21006', 2021, true, 'Wipro Technologies', 'ACTIVE', 'hostel_girls', '2021-07-19'),
  ('std_g21_007', 'Sunita Joshi', 'G21007', 2021, false, null, 'ACTIVE', 'hostel_girls', '2021-07-25'),
  ('std_g21_008', 'Meera Agarwal', 'G21008', 2021, false, null, 'ACTIVE', 'hostel_girls', '2021-07-17');

-- Year 2022 (9 students, 3 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date) VALUES 
  ('std_g22_001', 'Deepika Verma', 'G22001', 2022, false, null, 'ACTIVE', 'hostel_girls', '2022-07-15'),
  ('std_g22_002', 'Neha Yadav', 'G22002', 2022, true, 'Microsoft Corporation', 'ACTIVE', 'hostel_girls', '2022-07-18'),
  ('std_g22_003', 'Swati Mishra', 'G22003', 2022, false, null, 'ACTIVE', 'hostel_girls', '2022-07-20'),
  ('std_g22_004', 'Rekha Jain', 'G22004', 2022, true, 'Google India', 'ACTIVE', 'hostel_girls', '2022-07-16'),
  ('std_g22_005', 'Geeta Sharma', 'G22005', 2022, false, null, 'ACTIVE', 'hostel_girls', '2022-07-22'),
  ('std_g22_006', 'Sita Patel', 'G22006', 2022, true, 'Amazon Development Centre', 'ACTIVE', 'hostel_girls', '2022-07-19'),
  ('std_g22_007', 'Radha Singh', 'G22007', 2022, false, null, 'ACTIVE', 'hostel_girls', '2022-07-25'),
  ('std_g22_008', 'Lakshmi Kumar', 'G22008', 2022, false, null, 'ACTIVE', 'hostel_girls', '2022-07-17'),
  ('std_g22_009', 'Saraswati Gupta', 'G22009', 2022, false, null, 'ACTIVE', 'hostel_girls', '2022-07-21');

-- Year 2023 (8 students, 2 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date) VALUES 
  ('std_g23_001', 'Durga Reddy', 'G23001', 2023, false, null, 'ACTIVE', 'hostel_girls', '2023-07-15'),
  ('std_g23_002', 'Kali Joshi', 'G23002', 2023, true, 'IBM India', 'ACTIVE', 'hostel_girls', '2023-07-18'),
  ('std_g23_003', 'Parvati Agarwal', 'G23003', 2023, false, null, 'ACTIVE', 'hostel_girls', '2023-07-20'),
  ('std_g23_004', 'Asha Verma', 'G23004', 2023, true, 'Accenture Solutions', 'ACTIVE', 'hostel_girls', '2023-07-16'),
  ('std_g23_005', 'Usha Yadav', 'G23005', 2023, false, null, 'ACTIVE', 'hostel_girls', '2023-07-22'),
  ('std_g23_006', 'Lata Mishra', 'G23006', 2023, false, null, 'ACTIVE', 'hostel_girls', '2023-07-19'),
  ('std_g23_007', 'Nisha Jain', 'G23007', 2023, false, null, 'ACTIVE', 'hostel_girls', '2023-07-25'),
  ('std_g23_008', 'Shanti Sharma', 'G23008', 2023, false, null, 'ACTIVE', 'hostel_girls', '2023-07-17');

-- Some inactive/graduated students for testing
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id, join_date, leave_date) VALUES 
  ('std_b20_001', 'Former Student 1', 'B20001', 2020, false, null, 'GRADUATED', 'hostel_boys', '2020-07-15', '2024-06-30'),
  ('std_b20_002', 'Former Student 2', 'B20002', 2020, true, 'Past Company', 'GRADUATED', 'hostel_boys', '2020-07-15', '2024-06-30'),
  ('std_g20_001', 'Former Student 3', 'G20001', 2020, false, null, 'GRADUATED', 'hostel_girls', '2020-07-15', '2024-06-30'),
  ('std_b22_998', 'Transferred Student', 'B22998', 2022, false, null, 'TRANSFERRED', 'hostel_boys', '2022-07-15', '2023-12-31'),
  ('std_g22_999', 'Inactive Student', 'G22999', 2022, false, null, 'INACTIVE', 'hostel_girls', '2022-07-15', '2024-01-15');

-- Add provision items for testing
INSERT INTO provision_items (id, name, unit, unit_cost, unit_measure) VALUES 
  ('prov_001', 'Rice', 'kg', 45.00, '1 kg'),
  ('prov_002', 'Dal (Toor)', 'kg', 120.00, '1 kg'),
  ('prov_003', 'Wheat Flour', 'kg', 35.00, '1 kg'),
  ('prov_004', 'Cooking Oil', 'ltr', 180.00, '1 ltr'),
  ('prov_005', 'Onions', 'kg', 30.00, '1 kg'),
  ('prov_006', 'Potatoes', 'kg', 25.00, '1 kg'),
  ('prov_007', 'Tomatoes', 'kg', 40.00, '1 kg'),
  ('prov_008', 'Milk', 'ltr', 55.00, '1 ltr'),
  ('prov_009', 'Tea', 'kg', 400.00, '1 kg'),
  ('prov_010', 'Sugar', 'kg', 50.00, '1 kg'),
  ('prov_011', 'Salt', 'kg', 20.00, '1 kg'),
  ('prov_012', 'Spices Mix', 'kg', 300.00, '1 kg'),
  ('prov_013', 'Chicken', 'kg', 220.00, '1 kg'),
  ('prov_014', 'Fish', 'kg', 180.00, '1 kg'),
  ('prov_015', 'Vegetables (Mixed)', 'kg', 35.00, '1 kg');

-- Add some sample attendance data for the current month
INSERT INTO attendance (student_id, date, code, note) 
SELECT 
    s.id,
    CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 6),
    CASE 
        WHEN random() < 0.85 THEN 'P'::attendance_code
        WHEN random() < 0.95 THEN 'L'::attendance_code
        ELSE 'CN'::attendance_code
    END,
    CASE 
        WHEN random() < 0.9 THEN NULL
        ELSE 'Sample attendance data'
    END
FROM students s 
WHERE s.status = 'ACTIVE'
AND s.id NOT LIKE '%_998%' AND s.id NOT LIKE '%_999%';

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Total students inserted: 65 active + 5 inactive/graduated';
    RAISE NOTICE 'Boys hostel: 40 students (12 mando)';
    RAISE NOTICE 'Girls hostel: 25 students (8 mando)';
    RAISE NOTICE 'Provision items: 15 items added';
    RAISE NOTICE 'Sample attendance data added for past 7 days';
END $$;
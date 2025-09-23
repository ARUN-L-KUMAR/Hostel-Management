-- Comprehensive seed script for hostel mess management system
-- This script creates comprehensive dummy data for testing and development
-- Run this after 000_create_schema.sql

-- Clear existing student data first
DELETE FROM attendance WHERE student_id IN (SELECT id FROM students);
DELETE FROM inmate_month_summary WHERE student_id IN (SELECT id FROM students);
DELETE FROM student_bills WHERE student_id IN (SELECT id FROM students);
DELETE FROM students;

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

-- Add some provision items for testing
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
  ('prov_015', 'Vegetables (Mixed)', 'kg', 35.00, '1 kg')
ON CONFLICT (name) DO NOTHING;

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive seed data inserted successfully';
    RAISE NOTICE 'Total students inserted: 65 active + 5 inactive/graduated';
    RAISE NOTICE 'Boys hostel: 40 students (12 mando)';
    RAISE NOTICE 'Girls hostel: 25 students (8 mando)';
    RAISE NOTICE 'Provision items: 15 items added';
END $$;
-- Seed script with dummy student data
-- Creates 50 students with mix of mando and regular students

-- Boys Hostel Students (30 students, 8 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id) VALUES 
  ('std_001', 'Arjun Kumar', 'B21001', 2021, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_002', 'Rahul Sharma', 'B21002', 2021, true, 'TechCorp', 'ACTIVE', 'hostel_boys'),
  ('std_003', 'Vikram Singh', 'B21003', 2021, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_004', 'Amit Patel', 'B21004', 2021, true, 'InfoSys', 'ACTIVE', 'hostel_boys'),
  ('std_005', 'Suresh Reddy', 'B21005', 2021, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_006', 'Kiran Joshi', 'B21006', 2021, true, 'Wipro', 'ACTIVE', 'hostel_boys'),
  ('std_007', 'Deepak Gupta', 'B21007', 2021, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_008', 'Rajesh Kumar', 'B21008', 2021, true, 'TCS', 'ACTIVE', 'hostel_boys'),
  ('std_009', 'Manoj Verma', 'B21009', 2021, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_010', 'Sanjay Yadav', 'B21010', 2021, true, 'Accenture', 'ACTIVE', 'hostel_boys'),
  ('std_011', 'Ravi Agarwal', 'B22011', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_012', 'Ashok Mishra', 'B22012', 2022, true, 'IBM', 'ACTIVE', 'hostel_boys'),
  ('std_013', 'Naveen Kumar', 'B22013', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_014', 'Pradeep Singh', 'B22014', 2022, true, 'Microsoft', 'ACTIVE', 'hostel_boys'),
  ('std_015', 'Santosh Jain', 'B22015', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_016', 'Mukesh Sharma', 'B22016', 2022, true, 'Google', 'ACTIVE', 'hostel_boys'),
  ('std_017', 'Dinesh Patel', 'B22017', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_018', 'Ramesh Gupta', 'B22018', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_019', 'Sunil Kumar', 'B22019', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_020', 'Ajay Singh', 'B22020', 2022, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_021', 'Vijay Sharma', 'B23021', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_022', 'Anil Patel', 'B23022', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_023', 'Rohit Gupta', 'B23023', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_024', 'Sachin Kumar', 'B23024', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_025', 'Nitin Singh', 'B23025', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_026', 'Gaurav Sharma', 'B23026', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_027', 'Harsh Patel', 'B23027', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_028', 'Yash Gupta', 'B23028', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_029', 'Akash Kumar', 'B23029', 2023, false, null, 'ACTIVE', 'hostel_boys'),
  ('std_030', 'Varun Singh', 'B23030', 2023, false, null, 'ACTIVE', 'hostel_boys')
ON CONFLICT (roll_no) DO NOTHING;

-- Girls Hostel Students (20 students, 4 mando)
INSERT INTO students (id, name, roll_no, year, is_mando, company, status, hostel_id) VALUES 
  ('std_031', 'Priya Sharma', 'G21031', 2021, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_032', 'Sneha Patel', 'G21032', 2021, true, 'TechCorp', 'ACTIVE', 'hostel_girls'),
  ('std_033', 'Pooja Singh', 'G21033', 2021, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_034', 'Kavya Reddy', 'G21034', 2021, true, 'InfoSys', 'ACTIVE', 'hostel_girls'),
  ('std_035', 'Anita Kumar', 'G21035', 2021, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_036', 'Ritu Gupta', 'G21036', 2021, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_037', 'Sunita Joshi', 'G21037', 2021, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_038', 'Meera Agarwal', 'G21038', 2021, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_039', 'Deepika Verma', 'G22039', 2022, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_040', 'Neha Yadav', 'G22040', 2022, true, 'Wipro', 'ACTIVE', 'hostel_girls'),
  ('std_041', 'Swati Mishra', 'G22041', 2022, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_042', 'Rekha Jain', 'G22042', 2022, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_043', 'Geeta Sharma', 'G22043', 2022, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_044', 'Sita Patel', 'G22044', 2022, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_045', 'Radha Singh', 'G22045', 2022, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_046', 'Lakshmi Kumar', 'G23046', 2023, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_047', 'Saraswati Gupta', 'G23047', 2023, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_048', 'Durga Reddy', 'G23048', 2023, true, 'TCS', 'ACTIVE', 'hostel_girls'),
  ('std_049', 'Kali Joshi', 'G23049', 2023, false, null, 'ACTIVE', 'hostel_girls'),
  ('std_050', 'Parvati Agarwal', 'G23050', 2023, false, null, 'ACTIVE', 'hostel_girls')
ON CONFLICT (roll_no) DO NOTHING;

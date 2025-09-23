-- Fix any schema issues and ensure all tables exist with correct structure

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "mandoCoverage" CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS "provisionItems" CASCADE;

-- Create tables with correct structure
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "rollNumber" VARCHAR(50) UNIQUE NOT NULL,
    hostel VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    "isMando" BOOLEAN DEFAULT FALSE,
    "mandoMultiplier" DECIMAL(3,2) DEFAULT 1.00,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "provisionItems" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    breakfast VARCHAR(5) DEFAULT 'P',
    lunch VARCHAR(5) DEFAULT 'P',
    dinner VARCHAR(5) DEFAULT 'P',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", date)
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    "provisionItemId" INTEGER REFERENCES "provisionItems"(id),
    quantity DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "mandoCovered" DECIMAL(10,2) DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("studentId", month, year)
);

CREATE TABLE "mandoCoverage" (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    "totalCovered" DECIMAL(10,2) NOT NULL,
    "boysAmount" DECIMAL(10,2) NOT NULL,
    "girlsAmount" DECIMAL(10,2) NOT NULL,
    "remainingBudget" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

-- Create indexes for better performance
CREATE INDEX idx_students_hostel ON students(hostel);
CREATE INDEX idx_students_year ON students(year);
CREATE INDEX idx_students_mando ON students("isMando");
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_date ON attendance("studentId", date);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_bills_month_year ON bills(month, year);

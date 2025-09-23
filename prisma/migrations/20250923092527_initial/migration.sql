-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'ACCOUNTANT', 'MESS_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."AttendanceCode" AS ENUM ('P', 'L', 'CN', 'V', 'C');

-- CreateEnum
CREATE TYPE "public"."ExpenseType" AS ENUM ('LABOUR', 'PROVISION', 'MAINTENANCE', 'UTILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "public"."StudentBillStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "public"."LeavePolicy" AS ENUM ('CHARGED', 'NOT_CHARGED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hostels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isMando" BOOLEAN NOT NULL DEFAULT false,
    "company" TEXT,
    "status" "public"."StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hostelId" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "code" "public"."AttendanceCode" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inmate_month_summary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "enrolled" BOOLEAN NOT NULL DEFAULT true,
    "stayingDays" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "mandaysCounted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inmate_month_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provision_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "unitMeasure" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provision_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provision_usage" (
    "id" TEXT NOT NULL,
    "provisionItemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provision_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenses" (
    "id" TEXT NOT NULL,
    "type" "public"."ExpenseType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bills" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalExpense" DECIMAL(10,2) NOT NULL,
    "labourTotal" DECIMAL(10,2) NOT NULL,
    "provisionTotal" DECIMAL(10,2) NOT NULL,
    "carryForward" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "advanceTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "perDayRate" DECIMAL(10,2) NOT NULL,
    "totalMandays" INTEGER NOT NULL,
    "mandoAmount" DECIMAL(10,2) NOT NULL DEFAULT 70250,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_bills" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mandays" INTEGER NOT NULL,
    "perDayRate" DECIMAL(10,2) NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "adjustments" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "carryForwardApplied" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "public"."StudentBillStatus" NOT NULL DEFAULT 'UNPAID',
    "isMandoCovered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mando_settings" (
    "id" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 70250,
    "boysAmount" DECIMAL(10,2) NOT NULL DEFAULT 58200,
    "girlsAmount" DECIMAL(10,2) NOT NULL DEFAULT 12052,
    "perMealRate" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mando_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_settings" (
    "id" TEXT NOT NULL,
    "leavePolicy" "public"."LeavePolicy" NOT NULL DEFAULT 'CHARGED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hostels_name_key" ON "public"."hostels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "students_rollNo_key" ON "public"."students"("rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_studentId_date_key" ON "public"."attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "inmate_month_summary_studentId_month_key" ON "public"."inmate_month_summary"("studentId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "provision_items_name_key" ON "public"."provision_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bills_month_key" ON "public"."bills"("month");

-- CreateIndex
CREATE UNIQUE INDEX "student_bills_billId_studentId_key" ON "public"."student_bills"("billId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "public"."hostels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inmate_month_summary" ADD CONSTRAINT "inmate_month_summary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provision_usage" ADD CONSTRAINT "provision_usage_provisionItemId_fkey" FOREIGN KEY ("provisionItemId") REFERENCES "public"."provision_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provision_usage" ADD CONSTRAINT "provision_usage_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_bills" ADD CONSTRAINT "student_bills_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_bills" ADD CONSTRAINT "student_bills_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

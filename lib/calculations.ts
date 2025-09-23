export enum AttendanceCode {
  P = "P",
  L = "L", 
  CN = "CN",
  V = "V",
  C = "C"
}

export enum LeavePolicy {
  CHARGED = "CHARGED",
  NOT_CHARGED = "NOT_CHARGED"
}

export interface AttendanceRecord {
  code: AttendanceCode
  date: Date
}

export interface BillingOptions {
  leavePolicy: LeavePolicy
  mandoTotalAmount: number
  mandoBoysAmount: number
  mandoGirlsAmount: number
  perMealRate: number
  mealsPerDay: number
}

/**
 * Compute mandays based on attendance records and leave policy
 */
export function computeMandays(
  attendanceRecords: AttendanceRecord[],
  leavePolicy: LeavePolicy = LeavePolicy.CHARGED,
): number {
  let mandays = 0

  for (const record of attendanceRecords) {
    if (record.code === AttendanceCode.P) {
      mandays++
    } else if (record.code === AttendanceCode.L && leavePolicy === LeavePolicy.CHARGED) {
      mandays++
    }
    // CN, V, C are not counted in mandays
  }

  return mandays
}

/**
 * Compute per-day rate for billing
 */
export function computePerDayRate(
  totalExpenses: number,
  carryForward: number,
  pendingCost: number,
  advances: number,
  totalMandays: number,
): number {
  if (totalMandays === 0) return 0

  const netExpense = totalExpenses + pendingCost - advances - carryForward
  return netExpense / totalMandays
}

/**
 * Compute student bill amount
 */
export function computeStudentBill(
  studentMandays: number,
  perDayRate: number,
  isMando: boolean,
  adjustments = 0,
  carryForwardApplied = 0,
): {
  grossAmount: number
  finalAmount: number
  isMandoCovered: boolean
} {
  const grossAmount = perDayRate * studentMandays
  let finalAmount = grossAmount + adjustments - carryForwardApplied
  let isMandoCovered = false

  // Mando students have their bills covered by the mess
  if (isMando) {
    finalAmount = 0 // No charge for mando students
    isMandoCovered = true
  }

  return {
    grossAmount,
    finalAmount: Math.max(0, finalAmount), // Ensure non-negative
    isMandoCovered,
  }
}

/**
 * Calculate total mando coverage needed
 */
export function calculateMandoCoverage(
  mandoStudentBills: Array<{
    grossAmount: number
    hostelType: "Boys" | "Girls"
  }>,
  options: BillingOptions,
): {
  totalCoverage: number
  boysCoverage: number
  girlsCoverage: number
  isWithinBudget: boolean
} {
  const boysBills = mandoStudentBills.filter((b) => b.hostelType === "Boys")
  const girlsBills = mandoStudentBills.filter((b) => b.hostelType === "Girls")

  const boysCoverage = boysBills.reduce((sum, bill) => sum + bill.grossAmount, 0)
  const girlsCoverage = girlsBills.reduce((sum, bill) => sum + bill.grossAmount, 0)
  const totalCoverage = boysCoverage + girlsCoverage

  const isWithinBudget =
    boysCoverage <= options.mandoBoysAmount &&
    girlsCoverage <= options.mandoGirlsAmount &&
    totalCoverage <= options.mandoTotalAmount

  return {
    totalCoverage,
    boysCoverage,
    girlsCoverage,
    isWithinBudget,
  }
}

/**
 * Main billing calculation function that orchestrates the entire billing process
 */
export async function calculateBilling(month: number, year: number, carryForward = 0, advanceReceived = 0) {
  const { prisma } = await import("@/lib/db")

  // Get all students
  const students = await prisma.student.findMany({
    include: {
      attendance: {
        where: {
          date: {
            gte: new Date(year, month, 1),
            lte: new Date(year, month + 1, 0),
          },
        },
      },
    },
  })

  // Get total expenses for the month
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: new Date(year, month, 1),
        lte: new Date(year, month + 1, 0),
      },
    },
  })

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate total mandays for all students
  let totalMandays = 0
  const studentBills = []

  for (const student of students) {
    const attendanceRecords = student.attendance.map((att: any) => ({
      code: att.breakfast, // Simplified - using breakfast as primary meal
      date: att.date,
    }))

    const studentMandays = computeMandays(attendanceRecords)
    totalMandays += studentMandays

    studentBills.push({
      studentId: student.id,
      studentName: student.name,
      hostel: student.hostel,
      isMando: student.isMando,
      mandays: studentMandays,
    })
  }

  // Calculate per-day rate
  const perDayRate = computePerDayRate(
    totalExpenses,
    carryForward,
    0, // pending cost
    advanceReceived,
    totalMandays,
  )

  // Calculate individual student bills
  const finalStudentBills = studentBills.map((student) => {
    const bill = computeStudentBill(student.mandays, perDayRate, student.isMando)

    return {
      ...student,
      grossAmount: bill.grossAmount,
      finalAmount: bill.finalAmount,
      isMandoCovered: bill.isMandoCovered,
      totalAmount: bill.grossAmount,
      mandoCovered: bill.isMandoCovered ? bill.grossAmount : 0,
    }
  })

  // Calculate Mando coverage
  const mandoStudentBills = finalStudentBills
    .filter((bill) => bill.isMando)
    .map((bill) => ({
      grossAmount: bill.grossAmount,
      hostelType: bill.hostel.includes("Boys") ? ("Boys" as const) : ("Girls" as const),
    }))

  const mandoCoverage = calculateMandoCoverage(mandoStudentBills, {
    leavePolicy: "CHARGED" as any,
    mandoTotalAmount: 70250,
    mandoBoysAmount: 58200,
    mandoGirlsAmount: 12052,
    perMealRate: 50,
    mealsPerDay: 3,
  })

  return {
    month,
    year,
    totalExpenses,
    totalMandays,
    perDayRate,
    carryForward,
    advanceReceived,
    studentBills: finalStudentBills,
    mandoCoverage: {
      totalCovered: mandoCoverage.totalCoverage,
      boysAmount: mandoCoverage.boysCoverage,
      girlsAmount: mandoCoverage.girlsCoverage,
      remainingBudget: 70250 - mandoCoverage.totalCoverage,
      isWithinBudget: mandoCoverage.isWithinBudget,
    },
    summary: {
      totalStudents: students.length,
      mandoStudents: finalStudentBills.filter((b) => b.isMando).length,
      regularStudents: finalStudentBills.filter((b) => !b.isMando).length,
      totalBillAmount: finalStudentBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalMandoCovered: finalStudentBills.reduce((sum, bill) => sum + bill.mandoCovered, 0),
      totalCollectable: finalStudentBills.reduce((sum, bill) => sum + bill.finalAmount, 0),
    },
  }
}

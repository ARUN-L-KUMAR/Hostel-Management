import { prisma } from "@/lib/db"
import { AttendanceGrid } from "./attendance-grid"
import { AttendanceLegend } from "./attendance-legend"

async function getAttendanceData(year: string, month: string) {
  const currentMonth = `${year}-${month.padStart(2, '0')}`
  const startDate = new Date(`${currentMonth}-01`)
  const endDate = new Date(parseInt(year), parseInt(month), 0) // Last day of month

  // Get all students with their attendance for the month
  const students = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      hostel: true,
      attendance: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: [{ hostel: { name: "asc" } }, { name: "asc" }],
  })

  // Generate days for the month
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return { students, days, currentMonth }
}

export async function AttendanceCalendar({ year, month }: { year: string; month: string }) {
  const { students, days, currentMonth } = await getAttendanceData(year, month)

  return (
    <div className="space-y-4">
      <AttendanceLegend />
      <AttendanceGrid students={students} days={days} currentMonth={currentMonth} total={students.length} />
    </div>
  )
}

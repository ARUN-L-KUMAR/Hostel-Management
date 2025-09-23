import { prisma } from "@/lib/db"
import { AttendanceGrid } from "./attendance-grid"
import { AttendanceLegend } from "./attendance-legend"

async function getAttendanceData() {
  const currentMonth = "2024-12"
  const startDate = new Date(`${currentMonth}-01`)
  const endDate = new Date(`${currentMonth}-31`)

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
  const daysInMonth = new Date(2024, 11, 0).getDate() // December 2024
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return { students, days, currentMonth }
}

export async function AttendanceCalendar() {
  const { students, days, currentMonth } = await getAttendanceData()

  return (
    <div className="space-y-4">
      <AttendanceLegend />
      <AttendanceGrid students={students} days={days} currentMonth={currentMonth} />
    </div>
  )
}

import { prisma } from "@/lib/db"
import { AttendanceGrid } from "./attendance-grid"
import { AttendanceLegend } from "./attendance-legend"
import { AttendancePeriodFilters } from "./attendance-period-filters"

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

export async function AttendanceCalendar({ year, month, filters }: { year: string; month: string; filters: { hostel: string; year: string; mandoFilter: string; status: string } }) {
  const { students, days, currentMonth } = await getAttendanceData(year, month)

  // Filter students based on filters
  const filteredStudents = students.filter((student) => {
    if (filters.hostel !== "all" && !student.hostel.name.toLowerCase().includes(filters.hostel.toLowerCase())) return false
    if (filters.year !== "all" && student.year.toString() !== filters.year) return false
    if (filters.status !== "all" && student.status !== filters.status) return false
    if (filters.mandoFilter === "mando" && !student.isMando) return false
    if (filters.mandoFilter === "regular" && student.isMando) return false
    return true
  })

  return (
    <div className="space-y-4">
      <AttendanceLegend />
      <AttendancePeriodFilters />
      <AttendanceGrid students={filteredStudents} days={days} currentMonth={currentMonth} total={filteredStudents.length} />
    </div>
  )
}

import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceFilters } from "@/components/attendance/attendance-filters"
import { AttendanceActions } from "@/components/attendance/attendance-actions"

export const dynamic = 'force-dynamic'

export default function AttendancePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const year = typeof searchParams.year === 'string' ? searchParams.year : currentYear.toString()
  const month = typeof searchParams.month === 'string' ? searchParams.month : currentMonth.toString()
  const hostel = typeof searchParams.hostel === 'string' ? searchParams.hostel : "all"
  const academicYear = typeof searchParams.academicYear === 'string' ? searchParams.academicYear : "all"
  const mandoFilter = typeof searchParams.mandoFilter === 'string' ? searchParams.mandoFilter : "all"
  const status = typeof searchParams.status === 'string' ? searchParams.status : "all"

  const filters = {
    hostel,
    year: academicYear,
    mandoFilter,
    status,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
          <p className="text-slate-600">Track and manage student attendance with P/L/CN/V/C codes</p>
        </div>
        <AttendanceActions />
      </div>

      {/* Filters */}
      <AttendanceFilters />

      {/* Attendance Calendar */}
      <AttendanceCalendar year={year} month={month} filters={filters} />
    </div>
  )
}

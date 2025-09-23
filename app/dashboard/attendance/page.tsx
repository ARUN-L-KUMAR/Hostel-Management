import { Suspense } from "react"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceFilters } from "@/components/attendance/attendance-filters"
import { AttendanceActions } from "@/components/attendance/attendance-actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function AttendancePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const year = typeof searchParams.year === 'string' ? searchParams.year : currentYear.toString()
  const month = typeof searchParams.month === 'string' ? searchParams.month : currentMonth.toString()

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
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
      >
        <AttendanceCalendar year={year} month={month} />
      </Suspense>
    </div>
  )
}

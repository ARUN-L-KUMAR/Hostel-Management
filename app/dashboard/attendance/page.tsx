"use client"

import { useState } from "react"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceFilters } from "@/components/attendance/attendance-filters"
import { AttendanceActions } from "@/components/attendance/attendance-actions"

export default function AttendancePage() {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    mandoFilter: "all",
    status: "all",
  })

  const [dateRange, setDateRange] = useState({
    year: currentYear.toString(),
    month: currentMonth.toString(),
  })

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
      <AttendanceFilters onFiltersChange={setFilters} onDateRangeChange={setDateRange} />

      {/* Attendance Calendar */}
      <AttendanceCalendar year={dateRange.year} month={dateRange.month} filters={filters} />
    </div>
  )
}

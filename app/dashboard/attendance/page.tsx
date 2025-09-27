"use client"

import { useState } from "react"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceFilters } from "@/components/attendance/attendance-filters"
import { AttendanceActions } from "@/components/attendance/attendance-actions"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function AttendancePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const year = typeof searchParams.year === 'string' ? searchParams.year : currentYear.toString()
  const month = typeof searchParams.month === 'string' ? searchParams.month : currentMonth.toString()

  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    mandoFilter: "all",
    status: "all",
    dept: "all",
  })

  const [attendanceStudents, setAttendanceStudents] = useState<any[]>([])

  const exportAttendanceToCSV = () => {
    const monthName = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(month)]
    const filename = `attendance-${year}-${monthName}.csv`

    // Get days in month
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Header
    const header = ["Year", "Month", "Student", "Roll No", "Dept", "Hostel", "Year"]
    days.forEach(day => header.push(day.toString()))
    header.push("Total Present")

    const params = [header]

    // Student data
    attendanceStudents.forEach(student => {
      const row = [
        year,
        monthName,
        student.name,
        student.rollNo,
        student.dept || "Not Set",
        student.hostel?.name || "Unknown",
        student.year?.toString() || ""
      ]

      let totalPresent = 0
      days.forEach(day => {
        const attendance = student.attendance.find((att: any) => {
          const date = new Date(att.date)
          return date.getDate() === day
        })
        const code = attendance?.code || "-"
        row.push(code)
        if (code === "P") totalPresent++
      })

      row.push(totalPresent.toString())

      params.push(row)
    })

    // Convert to CSV
    const csvContent = params.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
          <p className="text-slate-600">Track and manage student attendance with P/L/CN/V/C codes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <AttendanceActions onExport={exportAttendanceToCSV} />
        </div>
      </div>

      {/* Filters */}
      <AttendanceFilters onFiltersChange={setFilters} />

      {/* Attendance Calendar */}
      <AttendanceCalendar year={year} month={month} filters={filters} onExport={exportAttendanceToCSV} onStudentsChange={setAttendanceStudents} />
    </div>
  )
}

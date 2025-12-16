"use client"

import { useState, useEffect } from "react"
import { AttendanceGrid } from "./attendance-grid"
import { AttendanceLegend } from "./attendance-legend"
import { AttendancePeriodFilters } from "./attendance-period-filters"
import { ApiClient } from "@/lib/api-client"
import type { AttendanceCode } from "@prisma/client"

interface Student {
  id: string
  name: string
  rollNo: string
  dept: string | null
  year: number
  isMando: boolean
  status: string
  hostel: { name: string }
  attendance: Array<{
    date: Date
    code: AttendanceCode
  }>
}

export function AttendanceCalendar({ year, month, filters, onExport, onStudentsChange }: { year: string; month: string; filters: { hostel: string; year: string; mandoFilter: string; status: string; dept: string }; onExport?: (students: any[]) => void; onStudentsChange?: (students: any[]) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log(`[v0] AttendanceCalendar useEffect triggered - month: ${month}, year: ${year}`)
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all students without filters
        const studentsData = await ApiClient.students.getAll({ status: "ACTIVE" })
        console.log(`[v0] Fetched ${studentsData.length} students`)

        // Client-side filtering
        const filteredStudents = studentsData.filter((student: any) => {
          const matchesHostel = filters.hostel === "all" || student.hostel?.name === filters.hostel
          const matchesYear = filters.year === "all" || student.year?.toString() === filters.year
          const matchesMando = filters.mandoFilter === "all" ||
            (filters.mandoFilter === "mando" && student.isMando) ||
            (filters.mandoFilter === "regular" && !student.isMando)
          const matchesDept = filters.dept === "all" || (student.dept && student.dept.toLowerCase().includes(filters.dept.toLowerCase()))

          return matchesHostel && matchesYear && matchesMando && matchesDept
        })

        console.log(`[v0] Filtered to ${filteredStudents.length} students`)

        // Fetch attendance data for the specific month
        console.log(`[v0] Fetching attendance for month: ${month}, year: ${year}`)
        const attendanceData = await ApiClient.attendance.get(parseInt(month), parseInt(year))
        console.log(`[v0] Fetched ${attendanceData.length} attendance records`)

        // Create date range for filtering attendance to this month only
        const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
        console.log(`[v0] Date range: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`)

        // Filter attendance to current month and combine with filtered students
        const studentsWithAttendance = filteredStudents.map((student: any) => {
          const studentAttendance = attendanceData
            .filter((att: any) => {
              const attDate = new Date(att.date)
              const isInRange = att.studentId === student.id &&
                attDate >= startOfMonth &&
                attDate <= endOfMonth
              if (isInRange) {
                console.log(`[v0] Student ${student.id}: attendance on ${attDate.toISOString()}`)
              }
              return isInRange
            })
            .map((att: any) => {
              // Normalize date to avoid timezone shifts and add +1 day
              const date = new Date(att.date)
              const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
              return {
                date: normalizedDate,
                code: att.code as AttendanceCode,
              }
            })

          return {
            ...student,
            attendance: studentAttendance,
          }
        })

        console.log(`[v0] Final result: ${studentsWithAttendance.filter((s: any) => s.attendance.length > 0).length} students with attendance`)
        setStudents(studentsWithAttendance)
        if (onStudentsChange) {
          onStudentsChange(studentsWithAttendance)
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year, month, filters])

  // Generate days for the month
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const currentMonth = `${year}-${month.padStart(2, '0')}`

  if (loading) {
    return (
      <div className="space-y-4">
        <AttendanceLegend />
        <AttendancePeriodFilters />
        <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg bg-muted/5">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading attendance data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AttendanceLegend />
      <AttendancePeriodFilters />
      <AttendanceGrid students={students} days={days} currentMonth={currentMonth} total={students.length} onExport={onExport} />
    </div>
  )
}

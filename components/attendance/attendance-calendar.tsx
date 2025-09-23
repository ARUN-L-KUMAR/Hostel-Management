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
  year: number
  isMando: boolean
  status: string
  hostel: { name: string }
  attendance: Array<{
    date: Date
    code: AttendanceCode
  }>
}

export function AttendanceCalendar({ year, month, filters }: { year: string; month: string; filters: { hostel: string; year: string; mandoFilter: string; status: string } }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch students with filters
        const studentsParams: any = { status: "ACTIVE" }
        if (filters.hostel !== "all") studentsParams.hostel = filters.hostel
        if (filters.year !== "all") studentsParams.year = filters.year
        if (filters.mandoFilter === "mando") studentsParams.isMando = "true"
        if (filters.mandoFilter === "regular") studentsParams.isMando = "false"

        const studentsData = await ApiClient.students.getAll(studentsParams)

        // Fetch attendance data for the month
        const attendanceData = await ApiClient.attendance.get(parseInt(month), parseInt(year))

        // Combine students with their attendance
        const studentsWithAttendance = studentsData.map((student: any) => {
          const studentAttendance = attendanceData.filter((att: any) => att.studentId === student.id)
          return {
            ...student,
            attendance: studentAttendance.map((att: any) => ({
              date: new Date(att.date),
              code: att.code as AttendanceCode,
            })),
          }
        })

        setStudents(studentsWithAttendance)
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-slate-600">Loading attendance data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AttendanceLegend />
      <AttendancePeriodFilters />
      <AttendanceGrid students={students} days={days} currentMonth={currentMonth} total={students.length} />
    </div>
  )
}

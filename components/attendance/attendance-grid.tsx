"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { AttendanceCode } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  rollNo: string
  year: number
  isMando: boolean
  hostel: { name: string }
  attendance: Array<{
    date: Date
    code: AttendanceCode
  }>
}

interface AttendanceGridProps {
  students: Student[]
  days: number[]
  currentMonth: string
  total: number
}

const attendanceCodes = [
  { code: "P" as AttendanceCode, label: "Present", color: "bg-green-500", textColor: "text-white" },
  { code: "L" as AttendanceCode, label: "Leave", color: "bg-yellow-500", textColor: "text-white" },
  { code: "CN" as AttendanceCode, label: "Concession", color: "bg-blue-500", textColor: "text-white" },
  { code: "V" as AttendanceCode, label: "Vacation", color: "bg-gray-500", textColor: "text-white" },
  { code: "C" as AttendanceCode, label: "Closed", color: "bg-red-500", textColor: "text-white" },
]

export function AttendanceGrid({ students, days, currentMonth, total }: AttendanceGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1')
  const totalPages = Math.ceil(total / 10)
  const start = (currentPage - 1) * 10

  const [localStudents, setLocalStudents] = useState(students)
  const paginatedStudents = localStudents.slice(start, start + 10)

  // Get today's date for highlighting
  const today = new Date()
  const todayDate = today.getDate()
  const todayMonth = today.getMonth() + 1
  const todayYear = today.getFullYear()
  const currentMonthNum = parseInt(currentMonth.split('-')[1])
  const currentYearNum = parseInt(currentMonth.split('-')[0])
  const isTodayInCurrentMonth = todayMonth === currentMonthNum && todayYear === currentYearNum

  useEffect(() => {
    setLocalStudents(students)
  }, [students])

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [bulkCode, setBulkCode] = useState<AttendanceCode>("P")

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const updateAttendance = async (studentId: string, date: string, code: AttendanceCode) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, date, code }),
      })
      if (response.ok) {
        // Update local state
        setLocalStudents(prev => prev.map(student => {
          if (student.id === studentId) {
            const existingIndex = student.attendance.findIndex(a => a.date.toISOString().split('T')[0] === date)
            if (existingIndex >= 0) {
              student.attendance[existingIndex].code = code
            } else {
              student.attendance.push({ date: new Date(date), code })
            }
          }
          return student
        }))
      } else {
        console.error('Failed to update attendance')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
    }
  }

  const getNextCode = (currentCode: AttendanceCode | undefined): AttendanceCode => {
    const codes: AttendanceCode[] = ["P", "L", "CN", "V", "C"]
    if (!currentCode) return "P"
    const currentIndex = codes.indexOf(currentCode)
    return codes[(currentIndex + 1) % codes.length]
  }

  const getAttendanceForDate = (student: Student, day: number) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
    return student.attendance.find((att) => {
      const attDate = new Date(att.date).toISOString().split("T")[0]
      return attDate === dateStr
    })
  }

  const getCodeStyle = (code: AttendanceCode) => {
    const codeConfig = attendanceCodes.find((c) => c.code === code)
    return codeConfig
      ? { bg: codeConfig.color, text: codeConfig.textColor }
      : { bg: "bg-gray-200", text: "text-gray-600" }
  }

  const getTotalPresent = (student: Student) => {
    return student.attendance.filter(att => att.code === "P").length
  }

  const handleCellClick = (studentId: string, day: number, isCtrlClick = false) => {
    const cellId = `${studentId}-${day}`

    if (isCtrlClick) {
      // Multi-select mode
      const newSelected = new Set(selectedCells)
      if (newSelected.has(cellId)) {
        newSelected.delete(cellId)
      } else {
        newSelected.add(cellId)
      }
      setSelectedCells(newSelected)
    } else {
      // Single select or cycle through codes
      if (selectedCells.size === 0) {
        // Cycle through attendance codes for single cell
        const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
        const attendance = getAttendanceForDate(paginatedStudents.find(s => s.id === studentId)!, day)
        const nextCode = getNextCode(attendance?.code)
        updateAttendance(studentId, dateStr, nextCode)
      }
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedCells.size > 0) {
      const updates = Array.from(selectedCells).map(cellId => {
        const [studentId, day] = cellId.split('-')
        const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
        return updateAttendance(studentId, dateStr, bulkCode)
      })
      await Promise.all(updates)
      setSelectedCells(new Set())
    }
  }

  return (
    <Card className="p-6 border-0 shadow-md max-w-screen-xl">
      {/* Bulk Actions */}
      {selectedCells.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedCells.size} cell{selectedCells.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={bulkCode}
              onChange={(e) => setBulkCode(e.target.value as AttendanceCode)}
              className="px-2 py-1 border border-blue-300 rounded text-sm"
            >
              {attendanceCodes.map((code) => (
                <option key={code.code} value={code.code}>
                  {code.code} - {code.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleBulkUpdate}>
              Apply to Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedCells(new Set())}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-max border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 border border-slate-300 border-r-2 border-r-slate-400 p-2 w-[200px] text-left font-semibold text-sm text-slate-700">
                Student
              </th>
              {days.map((day) => {
                const isToday = isTodayInCurrentMonth && day === todayDate
                return (
                  <th
                    key={day}
                    className={cn(
                      "border border-slate-300 p-1 w-10 text-center text-xs font-medium",
                      isToday
                        ? "bg-blue-100 text-blue-800 font-bold"
                        : "text-slate-600 bg-slate-50"
                    )}
                  >
                    {day}
                  </th>
                )
              })}
              <th className="sticky right-0 bg-slate-50 border border-slate-300 border-l-2 border-l-slate-400 p-2 w-[100px] text-center font-semibold text-sm text-slate-700">
                Total Present
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white border border-slate-300 border-r-2 border-r-slate-400 p-2 w-[200px]">
                  <div className="font-medium text-slate-900 truncate">{student.name}</div>
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <span>{student.rollNo}</span>
                    <span>•</span>
                    <span>{student.hostel.name}</span>
                    {student.isMando && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Mando
                      </Badge>
                    )}
                  </div>
                </td>
                {days.map((day) => {
                  const attendance = getAttendanceForDate(student, day)
                  const cellId = `${student.id}-${day}`
                  const isSelected = selectedCells.has(cellId)
                  const codeStyle = attendance
                    ? getCodeStyle(attendance.code)
                    : { bg: "bg-gray-100", text: "text-gray-400" }

                  return (
                    <td
                      key={day}
                      className="border border-slate-300 p-1 text-center cursor-pointer"
                      onClick={(e) => handleCellClick(student.id, day, e.ctrlKey || e.metaKey)}
                    >
                      <div
                        className={cn(
                          "h-8 w-10 mx-auto text-xs font-medium rounded border-2 transition-all hover:scale-105 flex items-center justify-center",
                          codeStyle.bg,
                          codeStyle.text,
                          isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent",
                          "hover:border-slate-300",
                        )}
                        title={`${student.name} - Day ${day}${attendance ? ` (${attendance.code})` : " (No data)"}`}
                      >
                        {attendance?.code || "-"}
                      </div>
                    </td>
                  )
                })}
                <td className="sticky right-0 bg-white border border-slate-300 border-l-2 border-l-slate-400 p-2 w-[100px] text-center">
                  <div className="font-semibold text-slate-900">
                    {getTotalPresent(student)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </Button>
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
        <Button
          variant="outline"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </Button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-slate-500 space-y-1">
        <p>• Click a cell to cycle through attendance codes (P → L → CN → V → C)</p>
        <p>• Hold Ctrl/Cmd and click to select multiple cells for bulk actions</p>
        <p>• Use the bulk actions bar above to apply codes to selected cells</p>
      </div>
    </Card>
  )
}

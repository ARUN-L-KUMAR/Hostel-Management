"use client"

import { useState } from "react"
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
}

const attendanceCodes = [
  { code: "P" as AttendanceCode, label: "Present", color: "bg-green-500", textColor: "text-white" },
  { code: "L" as AttendanceCode, label: "Leave", color: "bg-yellow-500", textColor: "text-white" },
  { code: "CN" as AttendanceCode, label: "Concession", color: "bg-blue-500", textColor: "text-white" },
  { code: "V" as AttendanceCode, label: "Vacation", color: "bg-gray-500", textColor: "text-white" },
  { code: "C" as AttendanceCode, label: "Closed", color: "bg-red-500", textColor: "text-white" },
]

export function AttendanceGrid({ students, days, currentMonth }: AttendanceGridProps) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [bulkCode, setBulkCode] = useState<AttendanceCode>("P")

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
        // This would trigger an API call to update attendance
        console.log(`[v0] Cycling attendance code for student ${studentId} on day ${day}`)
      }
    }
  }

  const handleBulkUpdate = () => {
    if (selectedCells.size > 0) {
      console.log(`[v0] Bulk updating ${selectedCells.size} cells to ${bulkCode}`)
      // This would trigger API calls to update multiple attendance records
      setSelectedCells(new Set())
    }
  }

  return (
    <Card className="p-6 border-0 shadow-md">
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

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header Row */}
          <div className="grid grid-cols-[200px_repeat(31,_40px)] gap-1 mb-2">
            <div className="font-semibold text-sm text-slate-700 p-2">Student</div>
            {days.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-600 p-1">
                {day}
              </div>
            ))}
          </div>

          {/* Student Rows */}
          <div className="space-y-1">
            {students.map((student) => (
              <div key={student.id} className="grid grid-cols-[200px_repeat(31,_40px)] gap-1 items-center">
                {/* Student Info */}
                <div className="p-2 text-sm">
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
                </div>

                {/* Attendance Cells */}
                {days.map((day) => {
                  const attendance = getAttendanceForDate(student, day)
                  const cellId = `${student.id}-${day}`
                  const isSelected = selectedCells.has(cellId)
                  const codeStyle = attendance
                    ? getCodeStyle(attendance.code)
                    : { bg: "bg-gray-100", text: "text-gray-400" }

                  return (
                    <button
                      key={day}
                      onClick={(e) => handleCellClick(student.id, day, e.ctrlKey || e.metaKey)}
                      className={cn(
                        "h-8 w-8 text-xs font-medium rounded border-2 transition-all hover:scale-105",
                        codeStyle.bg,
                        codeStyle.text,
                        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent",
                        "hover:border-slate-300",
                      )}
                      title={`${student.name} - Day ${day}${attendance ? ` (${attendance.code})` : " (No data)"}`}
                    >
                      {attendance?.code || "-"}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
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

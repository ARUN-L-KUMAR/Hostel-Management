"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { AttendanceCode } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  rollNo: string
  dept: string | null
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
  onExport?: (students: Student[]) => void
}

const attendanceCodes = [
  { code: "P" as AttendanceCode, label: "Present", color: "bg-emerald-500", textColor: "text-white" },
  { code: "L" as AttendanceCode, label: "Leave", color: "bg-amber-500", textColor: "text-white" },
  { code: "CN" as AttendanceCode, label: "Concession", color: "bg-blue-500", textColor: "text-white" },
  { code: "V" as AttendanceCode, label: "Vacation", color: "bg-purple-500", textColor: "text-white" },
  { code: "C" as AttendanceCode, label: "Closed", color: "bg-destructive", textColor: "text-white" },
]

export function AttendanceGrid({ students, days, currentMonth, total, onExport }: AttendanceGridProps) {
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

  const [openPopover, setOpenPopover] = useState<{ studentId: string; day: number } | null>(null)
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

  const handleAttendanceToggle = async (studentId: string, day: number, code: AttendanceCode | null) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
    if (code === null) {
      // Clear attendance
      await clearAttendance(studentId, dateStr)
    } else {
      await updateAttendance(studentId, dateStr, code)
    }
    setOpenPopover(null) // Close the popover after selection
  }

  const clearAttendance = async (studentId: string, date: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, date }),
      })
      if (response.ok) {
        // Update local state
        setLocalStudents(prev => prev.map(student => {
          if (student.id === studentId) {
            student.attendance = student.attendance.filter(a => a.date.toISOString().split('T')[0] !== date)
          }
          return student
        }))
      } else {
        console.error('Failed to clear attendance')
      }
    } catch (error) {
      console.error('Error clearing attendance:', error)
    }
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
      : { bg: "bg-muted", text: "text-muted-foreground" }
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
      // Open popover for attendance selection
      if (selectedCells.size === 0) {
        setOpenPopover({ studentId, day })
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
    <Card className="p-0 border-0 shadow-none max-w-screen-xl space-y-4">
      {/* Bulk Actions */}
      {selectedCells.size > 0 && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
          <span className="text-sm text-primary font-medium">
            {selectedCells.size} cell{selectedCells.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={bulkCode}
              onChange={(e) => setBulkCode(e.target.value as AttendanceCode)}
              className="px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:ring-1 focus:ring-primary"
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
            <Button size="sm" variant="ghost" onClick={() => setSelectedCells(new Set())}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto border border-border rounded-lg bg-background">
        <table className="min-w-max border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/50 border-b border-border">
              <th className="sticky left-0 bg-background border-r border-border p-3 w-[200px] text-left font-semibold text-sm text-foreground shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                Student
              </th>
              {days.map((day) => {
                const isToday = isTodayInCurrentMonth && day === todayDate
                return (
                  <th
                    key={day}
                    className="border-r border-border p-2 text-center text-sm font-medium min-w-[50px] last:border-r-0"
                  >
                    <div className={cn(
                      "py-1 rounded-sm text-xs",
                      isToday ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground"
                    )}>
                      {day}
                    </div>
                  </th>
                )
              })}
              <th className="sticky right-0 bg-background border-l border-border p-3 w-[120px] text-center font-semibold text-sm text-foreground shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
                Total Present
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedStudents.map((student) => (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                <td className="sticky left-0 bg-background border-r border-border p-3 w-[200px] shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  <div className="font-medium text-foreground truncate text-sm">{student.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span>{student.rollNo}</span>
                    <span className="text-border">•</span>
                    <span className="truncate max-w-[50px]">{student.dept || 'N/A'}</span>
                    <span className="text-border">•</span>
                    <span className="truncate max-w-[60px]">{student.hostel.name}</span>
                    {student.isMando && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-200">
                        Mando
                      </Badge>
                    )}
                  </div>
                </td>
                {days.map((day) => {
                  const attendance = getAttendanceForDate(student, day)
                  const cellId = `${student.id}-${day}`
                  const isSelected = selectedCells.has(cellId)

                  return (
                    <td key={day} className="border-r border-border p-1 text-center last:border-r-0">
                      <Popover
                        open={openPopover?.studentId === student.id && openPopover?.day === day}
                        onOpenChange={(open) => setOpenPopover(open ? { studentId: student.id, day } : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 text-xs font-semibold p-0 rounded-sm",
                              attendance?.code ? `${getCodeStyle(attendance.code).bg} ${getCodeStyle(attendance.code).text} hover:opacity-90` : "text-muted-foreground/20 hover:bg-muted hover:text-muted-foreground",
                              isSelected ? "ring-2 ring-primary border-primary" : "",
                            )}
                            onClick={(e) => handleCellClick(student.id, day, e.ctrlKey || e.metaKey)}
                          >
                            {attendance?.code || "-"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-4 shadow-lg border-border" align="center">
                          <div className="space-y-4">
                            <div className="text-sm font-semibold text-center pb-2 border-b">Day {day} - Attendance</div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer" onClick={() => handleAttendanceToggle(student.id, day, null)}>
                                <input
                                  type="radio"
                                  id={`attendance-${student.id}-${day}-none`}
                                  name={`attendance-${student.id}-${day}`}
                                  checked={!attendance?.code}
                                  onChange={() => handleAttendanceToggle(student.id, day, null)}
                                  className="text-primary focus:ring-primary"
                                />
                                <label
                                  htmlFor={`attendance-${student.id}-${day}-none`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                                    None
                                  </span>

                                </label>
                              </div>
                              {attendanceCodes.map((code) => (
                                <div key={code.code} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer" onClick={() => handleAttendanceToggle(student.id, day, code.code)}>
                                  <input
                                    type="radio"
                                    id={`attendance-${student.id}-${day}-${code.code}`}
                                    name={`attendance-${student.id}-${day}`}
                                    checked={attendance?.code === code.code}
                                    onChange={() => handleAttendanceToggle(student.id, day, code.code)}
                                    className="text-primary focus:ring-primary"
                                  />
                                  <label
                                    htmlFor={`attendance-${student.id}-${day}-${code.code}`}
                                    className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                                  >
                                    <span className={cn("px-2 py-1 rounded text-xs font-medium w-8 text-center", code.color, code.textColor)}>
                                      {code.code}
                                    </span>
                                    <span className="text-muted-foreground text-xs">{code.label}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  )
                })}
                <td className="sticky right-0 bg-background border-l border-border p-3 w-[120px] text-center shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
                  <div className="font-semibold text-foreground text-sm">
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
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </Button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-muted-foreground space-y-1">
        <p>• Click on a day cell to open the attendance selection popup</p>
        <p>• Select the appropriate attendance code from the popup</p>
        <p>• Hold Ctrl/Cmd and click to select multiple cells for bulk actions</p>
        <p>• Use the bulk actions bar above to apply codes to selected cells</p>
      </div>
    </Card>
  )
}

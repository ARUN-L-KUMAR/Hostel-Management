"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { AttendanceCode } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react"
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

interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

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

  // Rubber-band selection state
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cellPositions = useRef<Map<string, DOMRect>>(new Map())

  // Optimistic update state
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const updateAttendance = async (studentId: string, date: string, code: AttendanceCode) => {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, date, code }),
    })
    if (!response.ok) {
      throw new Error('Failed to update attendance')
    }
    return response.json()
  }

  const clearAttendance = async (studentId: string, date: string) => {
    const response = await fetch('/api/attendance', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, date }),
    })
    if (!response.ok) {
      throw new Error('Failed to clear attendance')
    }
    return response.json()
  }

  // Optimistic update for single cell
  const handleAttendanceToggle = async (studentId: string, day: number, code: AttendanceCode | null) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`

    // Store previous state for rollback
    const previousStudents = localStudents.map(s => ({ ...s, attendance: [...s.attendance] }))

    // Optimistically update UI
    setLocalStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        if (code === null) {
          return {
            ...student,
            attendance: student.attendance.filter(a => {
              const attDate = new Date(a.date).toISOString().split('T')[0]
              return attDate !== dateStr
            })
          }
        } else {
          const existingIndex = student.attendance.findIndex(a => {
            const attDate = new Date(a.date).toISOString().split('T')[0]
            return attDate === dateStr
          })
          if (existingIndex >= 0) {
            const newAttendance = [...student.attendance]
            newAttendance[existingIndex] = { ...newAttendance[existingIndex], code }
            return { ...student, attendance: newAttendance }
          } else {
            return {
              ...student,
              attendance: [...student.attendance, { date: new Date(dateStr), code }]
            }
          }
        }
      }
      return student
    }))

    setOpenPopover(null)

    // Sync with DB
    try {
      if (code === null) {
        await clearAttendance(studentId, dateStr)
      } else {
        await updateAttendance(studentId, dateStr, code)
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      // Rollback on error
      setLocalStudents(previousStudents)
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

  // Register cell position for rubber-band detection
  const registerCellRef = useCallback((element: HTMLElement | null, cellId: string) => {
    if (element) {
      cellPositions.current.set(cellId, element.getBoundingClientRect())
    }
  }, [])

  // Update cell positions on scroll/resize
  const updateCellPositions = useCallback(() => {
    const cells = document.querySelectorAll('[data-cell-id]')
    cells.forEach((cell) => {
      const cellId = cell.getAttribute('data-cell-id')
      if (cellId) {
        cellPositions.current.set(cellId, cell.getBoundingClientRect())
      }
    })
  }, [])

  // Check if a cell is within the selection rectangle
  const isCellInSelection = useCallback((cellId: string, rect: SelectionRect) => {
    const cellRect = cellPositions.current.get(cellId)
    if (!cellRect) return false

    const selLeft = Math.min(rect.startX, rect.endX)
    const selRight = Math.max(rect.startX, rect.endX)
    const selTop = Math.min(rect.startY, rect.endY)
    const selBottom = Math.max(rect.startY, rect.endY)

    // Check intersection
    return !(cellRect.right < selLeft ||
      cellRect.left > selRight ||
      cellRect.bottom < selTop ||
      cellRect.top > selBottom)
  }, [])

  // Mouse event handlers for rubber-band selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on left click and not on interactive elements
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="dialog"]')) return

    updateCellPositions()
    setIsSelecting(true)
    setSelectionRect({
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY
    })
    e.preventDefault()
  }, [updateCellPositions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selectionRect) return

    setSelectionRect(prev => prev ? {
      ...prev,
      endX: e.clientX,
      endY: e.clientY
    } : null)
  }, [isSelecting, selectionRect])

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selectionRect) {
      setIsSelecting(false)
      setSelectionRect(null)
      return
    }

    // Calculate which cells are in the selection
    const newSelected = new Set<string>()

    paginatedStudents.forEach(student => {
      days.forEach(day => {
        const cellId = `${student.id}-${day}`
        if (isCellInSelection(cellId, selectionRect)) {
          newSelected.add(cellId)
        }
      })
    })

    if (newSelected.size > 0) {
      setSelectedCells(newSelected)
    }

    setIsSelecting(false)
    setSelectionRect(null)
  }, [isSelecting, selectionRect, paginatedStudents, days, isCellInSelection])

  // Global mouse up handler to handle mouse release outside container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp()
      }
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isSelecting, handleMouseUp])

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

  // Optimistic bulk update
  const handleBulkUpdate = async () => {
    if (selectedCells.size === 0) return

    // Store previous state for rollback
    const previousStudents = localStudents.map(s => ({ ...s, attendance: [...s.attendance] }))

    // Optimistically update UI immediately
    setLocalStudents(prev => prev.map(student => {
      const studentCells = Array.from(selectedCells).filter(cellId => cellId.startsWith(student.id + '-'))
      if (studentCells.length === 0) return student

      let newAttendance = [...student.attendance]

      studentCells.forEach(cellId => {
        const day = parseInt(cellId.split('-')[1])
        const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`

        if (!bulkCode) {
          // Remove attendance (None selected)
          newAttendance = newAttendance.filter(a => {
            const attDate = new Date(a.date).toISOString().split('T')[0]
            return attDate !== dateStr
          })
        } else {
          const existingIndex = newAttendance.findIndex(a => {
            const attDate = new Date(a.date).toISOString().split('T')[0]
            return attDate === dateStr
          })

          if (existingIndex >= 0) {
            newAttendance[existingIndex] = { ...newAttendance[existingIndex], code: bulkCode }
          } else {
            newAttendance.push({ date: new Date(dateStr), code: bulkCode })
          }
        }
      })

      return { ...student, attendance: newAttendance }
    }))

    setIsSaving(true)
    setSaveStatus('idle')

    // Prepare all updates
    const updates = Array.from(selectedCells).map(cellId => {
      const [studentId, dayStr] = cellId.split('-')
      const dateStr = `${currentMonth}-${dayStr.padStart(2, "0")}`
      if (!bulkCode) {
        return clearAttendance(studentId, dateStr)
      }
      return updateAttendance(studentId, dateStr, bulkCode)
    })

    try {
      await Promise.all(updates)
      setSaveStatus('success')
      setSelectedCells(new Set())

      // Reset status after delay
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error updating attendance:', error)
      setSaveStatus('error')
      // Rollback on error
      setLocalStudents(previousStudents)

      // Reset status after delay
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate selection rectangle style
  const getSelectionRectStyle = () => {
    if (!selectionRect) return {}

    const left = Math.min(selectionRect.startX, selectionRect.endX)
    const top = Math.min(selectionRect.startY, selectionRect.endY)
    const width = Math.abs(selectionRect.endX - selectionRect.startX)
    const height = Math.abs(selectionRect.endY - selectionRect.startY)

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      pointerEvents: 'none' as const,
    }
  }

  return (
    <Card className="p-0 border-0 shadow-none max-w-screen-xl space-y-4">
      {/* Bulk Actions */}
      {selectedCells.size > 0 && (
        <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-xl flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{selectedCells.size}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">
                {selectedCells.size} cell{selectedCells.size > 1 ? "s" : ""} selected
              </span>
              <p className="text-xs text-muted-foreground">Ready for bulk update</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  className="gap-2 min-w-[140px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      bulkCode ? attendanceCodes.find(c => c.code === bulkCode)?.color : "bg-muted",
                      bulkCode ? attendanceCodes.find(c => c.code === bulkCode)?.textColor : "text-muted-foreground"
                    )}>
                      {bulkCode || "-"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {bulkCode ? attendanceCodes.find(c => c.code === bulkCode)?.label : "None"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4 shadow-lg border-border" align="center">
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-center pb-2 border-b">Select Attendance Code</div>
                  <div className="space-y-2">
                    <div
                      className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => setBulkCode(null as unknown as AttendanceCode)}
                    >
                      <input
                        type="radio"
                        id="bulk-code-none"
                        name="bulk-attendance-code"
                        checked={!bulkCode}
                        onChange={() => setBulkCode(null as unknown as AttendanceCode)}
                        className="text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="bulk-code-none"
                        className="text-sm cursor-pointer flex-1"
                      >
                        <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                          None
                        </span>
                      </label>
                    </div>
                    {attendanceCodes.map((code) => (
                      <div
                        key={code.code}
                        className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer"
                        onClick={() => setBulkCode(code.code)}
                      >
                        <input
                          type="radio"
                          id={`bulk-code-${code.code}`}
                          name="bulk-attendance-code"
                          checked={bulkCode === code.code}
                          onChange={() => setBulkCode(code.code)}
                          className="text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`bulk-code-${code.code}`}
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
            <Button
              size="sm"
              onClick={handleBulkUpdate}
              disabled={isSaving}
              className="gap-2 min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Saved!
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Failed
                </>
              ) : (
                'Apply to Selected'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedCells(new Set())}
              disabled={isSaving}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Selection Rectangle Overlay */}
      {isSelecting && selectionRect && (
        <div
          className="bg-primary/20 border-2 border-primary rounded-sm z-50"
          style={getSelectionRectStyle()}
        />
      )}

      {/* Attendance Table with rubber-band selection */}
      <div
        ref={containerRef}
        className="overflow-x-auto border border-border rounded-lg bg-background select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ cursor: isSelecting ? 'crosshair' : 'default' }}
      >
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
                  const isInDragSelection = isSelecting && selectionRect && isCellInSelection(cellId, selectionRect)

                  return (
                    <td
                      key={day}
                      className="border-r border-border p-1 text-center last:border-r-0"
                      data-cell-id={cellId}
                    >
                      <Popover
                        open={openPopover?.studentId === student.id && openPopover?.day === day}
                        onOpenChange={(open) => setOpenPopover(open ? { studentId: student.id, day } : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 text-xs font-semibold p-0 rounded-sm transition-all duration-150",
                              attendance?.code ? `${getCodeStyle(attendance.code).bg} ${getCodeStyle(attendance.code).text} hover:opacity-90` : "text-muted-foreground/20 hover:bg-muted hover:text-muted-foreground",
                              isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105" : "",
                              isInDragSelection ? "ring-2 ring-primary/60 bg-primary/10" : "",
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCellClick(student.id, day, e.ctrlKey || e.metaKey)
                            }}
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
      <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
        <h4 className="font-semibold text-sm text-foreground mb-2">Quick Tips</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Click & Drag</strong> to select multiple cells (rubber-band selection)</p>
          <p>• <strong>Click</strong> on a cell to open the attendance popup</p>
          <p>• <strong>Ctrl/Cmd + Click</strong> to toggle individual cells in selection</p>
          <p>• Use the bulk actions bar to apply codes to all selected cells</p>
        </div>
      </div>
    </Card>
  )
}

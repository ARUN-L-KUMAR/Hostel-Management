"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  rollNo: string
  dept: string | null
  gender: string | null
  company: string | null
  meals: Array<{
    id: number
    date: string
    breakfast: boolean
    lunch: boolean
    dinner: boolean
    present: boolean
    mealRate: number
  }>
}

interface MealEntryGridProps {
  students: Student[]
  days: number[]
  currentMonth: string
  total: number
  onExport?: (students: Student[]) => void
}

interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

type MealType = "breakfast" | "lunch" | "dinner" | "present"

const mealOptions = [
  { type: "breakfast" as MealType, label: "Breakfast", code: "B", color: "bg-emerald-500" },
  { type: "lunch" as MealType, label: "Lunch", code: "L", color: "bg-blue-500" },
  { type: "dinner" as MealType, label: "Dinner", code: "D", color: "bg-orange-500" },
  { type: "present" as MealType, label: "Present", code: "P", color: "bg-purple-500" },
]

export function MealEntryGrid({ students, days, currentMonth, total, onExport }: MealEntryGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1')
  const totalPages = Math.ceil(total / 10)

  const [localStudents, setLocalStudents] = useState(students)
  const paginatedStudents = localStudents.slice((currentPage - 1) * 10, currentPage * 10)

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

  // Rubber-band selection state
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  // Bulk meal selection (multi-select like individual cell popover)
  const [bulkMeals, setBulkMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    present: false,
  })
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

  const updateMealApi = async (studentId: string, date: string, breakfast: boolean, lunch: boolean, dinner: boolean, present: boolean) => {
    const response = await fetch('/api/mando-meal-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, date, breakfast, lunch, dinner, present }),
    })
    if (!response.ok) {
      throw new Error('Failed to update meal')
    }
    return response.json()
  }

  // Optimistic single meal update
  const handleMealToggle = async (studentId: string, day: number, mealType: MealType, checked: boolean | "indeterminate") => {
    const isChecked = checked === true
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`

    // Store previous state for rollback
    const previousStudents = localStudents.map(s => ({ ...s, meals: [...s.meals] }))

    // Get current meal record
    const currentStudent = localStudents.find(s => s.id === studentId)
    const currentMealRecord = currentStudent?.meals.find(m => m.date.startsWith(dateStr))

    // Optimistically update UI
    setLocalStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const existingIndex = student.meals.findIndex(m => m.date.startsWith(dateStr))
        const newMeals = [...student.meals]

        const updatedMeal = {
          id: currentMealRecord?.id || 0,
          date: dateStr,
          breakfast: mealType === "breakfast" ? isChecked : (currentMealRecord?.breakfast || false),
          lunch: mealType === "lunch" ? isChecked : (currentMealRecord?.lunch || false),
          dinner: mealType === "dinner" ? isChecked : (currentMealRecord?.dinner || false),
          present: mealType === "present" ? isChecked : (currentMealRecord?.present || false),
          mealRate: currentMealRecord?.mealRate || 0,
        }

        if (existingIndex >= 0) {
          newMeals[existingIndex] = updatedMeal
        } else {
          newMeals.push(updatedMeal)
        }

        return { ...student, meals: newMeals }
      }
      return student
    }))

    // Sync with DB
    try {
      const meal = currentMealRecord || { breakfast: false, lunch: false, dinner: false, present: false }
      await updateMealApi(
        studentId,
        dateStr,
        mealType === "breakfast" ? isChecked : meal.breakfast,
        mealType === "lunch" ? isChecked : meal.lunch,
        mealType === "dinner" ? isChecked : meal.dinner,
        mealType === "present" ? isChecked : meal.present
      )
    } catch (error) {
      console.error('Error updating meal:', error)
      // Rollback on error
      setLocalStudents(previousStudents)
    }
  }

  const getMealForDate = (student: Student, day: number) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
    return student.meals.find((meal) => meal.date.startsWith(dateStr))
  }

  const getTotalMeals = (student: Student) => {
    return student.meals.reduce((total, meal) =>
      total + (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0), 0)
  }

  const getTotalPresent = (student: Student) => {
    return student.meals.reduce((total, meal) =>
      total + ((meal.present || meal.breakfast || meal.lunch || meal.dinner) ? 1 : 0), 0)
  }

  const getMealSummary = (mealRecord: any) => {
    if (!mealRecord) return ""
    const meals = []
    if (mealRecord.breakfast) meals.push("B")
    if (mealRecord.lunch) meals.push("L")
    if (mealRecord.dinner) meals.push("D")
    if (mealRecord.present) meals.push("P")
    return meals.join(",")
  }

  // Update cell positions on scroll/resize
  const updateCellPositions = useCallback(() => {
    const cells = document.querySelectorAll('[data-meal-cell-id]')
    cells.forEach((cell) => {
      const cellId = cell.getAttribute('data-meal-cell-id')
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

    return !(cellRect.right < selLeft ||
      cellRect.left > selRight ||
      cellRect.bottom < selTop ||
      cellRect.top > selBottom)
  }, [])

  // Mouse event handlers for rubber-band selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="dialog"]') || target.closest('input')) return

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

  // Global mouse up handler
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
      const newSelected = new Set(selectedCells)
      if (newSelected.has(cellId)) {
        newSelected.delete(cellId)
      } else {
        newSelected.add(cellId)
      }
      setSelectedCells(newSelected)
    } else {
      if (selectedCells.size === 0) {
        setOpenPopover({ studentId, day })
      }
    }
  }

  // Optimistic bulk update
  const handleBulkUpdate = async () => {
    if (selectedCells.size === 0) return

    // Store previous state for rollback
    const previousStudents = localStudents.map(s => ({ ...s, meals: [...s.meals] }))

    // Optimistically update UI
    setLocalStudents(prev => prev.map(student => {
      const studentCells = Array.from(selectedCells).filter(cellId => cellId.startsWith(student.id + '-'))
      if (studentCells.length === 0) return student

      const newMeals = [...student.meals]

      studentCells.forEach(cellId => {
        const day = parseInt(cellId.split('-')[1])
        const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`

        const existingIndex = newMeals.findIndex(m => m.date.startsWith(dateStr))
        const existingMeal = existingIndex >= 0 ? newMeals[existingIndex] : null

        const updatedMeal = {
          id: existingMeal?.id || 0,
          date: dateStr,
          breakfast: bulkMeals.breakfast,
          lunch: bulkMeals.lunch,
          dinner: bulkMeals.dinner,
          present: bulkMeals.present,
          mealRate: existingMeal?.mealRate || 0,
        }

        if (existingIndex >= 0) {
          newMeals[existingIndex] = updatedMeal
        } else {
          newMeals.push(updatedMeal)
        }
      })

      return { ...student, meals: newMeals }
    }))

    setIsSaving(true)
    setSaveStatus('idle')

    // Prepare all updates
    const updates = Array.from(selectedCells).map(cellId => {
      const [studentId, dayStr] = cellId.split('-')
      const dateStr = `${currentMonth}-${dayStr.padStart(2, "0")}`

      return updateMealApi(
        studentId,
        dateStr,
        bulkMeals.breakfast,
        bulkMeals.lunch,
        bulkMeals.dinner,
        bulkMeals.present
      )
    })

    try {
      await Promise.all(updates)
      setSaveStatus('success')
      setSelectedCells(new Set())
      // Reset bulk meals after applying
      setBulkMeals({ breakfast: false, lunch: false, dinner: false, present: false })
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error updating meals:', error)
      setSaveStatus('error')
      setLocalStudents(previousStudents)
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
                  className="gap-2 min-w-[160px] justify-between"
                >
                  <div className="flex items-center gap-1">
                    {bulkMeals.breakfast && <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white bg-emerald-500">B</span>}
                    {bulkMeals.lunch && <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white bg-blue-500">L</span>}
                    {bulkMeals.dinner && <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white bg-orange-500">D</span>}
                    {!bulkMeals.breakfast && !bulkMeals.lunch && !bulkMeals.dinner && (
                      <span className="text-muted-foreground text-xs">Select meals...</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4 shadow-lg border-border" align="center">
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-center pb-2 border-b">Select Meals to Apply</div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="bulk-breakfast"
                        checked={bulkMeals.breakfast}
                        onCheckedChange={(checked) => setBulkMeals(prev => ({ ...prev, breakfast: checked === true }))}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <label htmlFor="bulk-breakfast" className="text-sm font-medium cursor-pointer">
                        Breakfast
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="bulk-lunch"
                        checked={bulkMeals.lunch}
                        onCheckedChange={(checked) => setBulkMeals(prev => ({ ...prev, lunch: checked === true }))}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <label htmlFor="bulk-lunch" className="text-sm font-medium cursor-pointer">
                        Lunch
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="bulk-dinner"
                        checked={bulkMeals.dinner}
                        onCheckedChange={(checked) => setBulkMeals(prev => ({ ...prev, dinner: checked === true }))}
                        className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <label htmlFor="bulk-dinner" className="text-sm font-medium cursor-pointer">
                        Dinner
                      </label>
                    </div>
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

      {/* Meal Entry Table with rubber-band selection */}
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
                    className="border-r border-border p-2 text-center text-sm font-medium min-w-[60px] last:border-r-0"
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
              <th className="sticky right-0 bg-background border-l border-border p-3 w-[200px] text-center font-semibold text-sm text-foreground shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
                <div className="grid grid-cols-2 gap-2">
                  <div>Meals</div>
                  <div>Present</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedStudents.map((student) => (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                <td className="sticky left-0 bg-background border-r border-border p-3 w-[200px] shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  <div className="font-medium text-foreground truncate text-sm">{student.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {student.rollNo || 'N/A'} • {student.dept || 'N/A'}
                  </div>
                </td>
                {days.map((day) => {
                  const mealRecord = getMealForDate(student, day)
                  const mealSummary = getMealSummary(mealRecord)
                  const mealCount = mealRecord ? (mealRecord.breakfast ? 1 : 0) + (mealRecord.lunch ? 1 : 0) + (mealRecord.dinner ? 1 : 0) + (mealRecord.present ? 1 : 0) : 0
                  const cellId = `${student.id}-${day}`
                  const isSelected = selectedCells.has(cellId)
                  const isInDragSelection = isSelecting && selectionRect && isCellInSelection(cellId, selectionRect)

                  return (
                    <td
                      key={day}
                      className="border-r border-border p-1 text-center last:border-r-0"
                      data-meal-cell-id={cellId}
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
                              "h-8 w-full text-xs font-semibold rounded-sm transition-all duration-150",
                              mealCount > 0
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
                                : "text-muted-foreground/30 hover:bg-muted",
                              isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105" : "",
                              isInDragSelection ? "ring-2 ring-primary/60 bg-primary/10" : "",
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCellClick(student.id, day, e.ctrlKey || e.metaKey)
                            }}
                          >
                            {mealCount > 0 ? `${mealSummary}` : "-"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-4 shadow-lg border-border" align="center">
                          <div className="space-y-4">
                            <div className="text-sm font-semibold text-center border-b pb-2">Day {day} - {student.name}</div>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`breakfast-${student.id}-${day}`}
                                  checked={mealRecord?.breakfast || false}
                                  onCheckedChange={(checked) => handleMealToggle(student.id, day, "breakfast", checked)}
                                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                                <label htmlFor={`breakfast-${student.id}-${day}`} className="text-sm font-medium">
                                  Breakfast
                                </label>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`lunch-${student.id}-${day}`}
                                  checked={mealRecord?.lunch || false}
                                  onCheckedChange={(checked) => handleMealToggle(student.id, day, "lunch", checked)}
                                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                                <label htmlFor={`lunch-${student.id}-${day}`} className="text-sm font-medium">
                                  Lunch
                                </label>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`dinner-${student.id}-${day}`}
                                  checked={mealRecord?.dinner || false}
                                  onCheckedChange={(checked) => handleMealToggle(student.id, day, "dinner", checked)}
                                  className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <label htmlFor={`dinner-${student.id}-${day}`} className="text-sm font-medium">
                                  Dinner
                                </label>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  )
                })}
                <td className="sticky right-0 bg-background border-l border-border p-3 w-[200px] text-center shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold text-foreground text-sm">
                      {getTotalMeals(student)}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      {getTotalPresent(student)}
                    </div>
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
          <p>• <strong>Click</strong> on a cell to open the meal selection popup</p>
          <p>• <strong>Ctrl/Cmd + Click</strong> to toggle individual cells in selection</p>
          <p>• Use the bulk actions bar to apply meal types to all selected cells</p>
        </div>
      </div>
    </Card>
  )
}
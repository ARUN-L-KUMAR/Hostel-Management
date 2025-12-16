"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download } from "lucide-react"
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

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const updateMeal = async (studentId: string, date: string, mealType: "breakfast" | "lunch" | "dinner" | "present", value: boolean) => {
    try {
      // Get current meal record to preserve other values
      const currentStudent = localStudents.find(s => s.id === studentId)
      const currentMealRecord = currentStudent?.meals.find(m => m.date.startsWith(date))

      // Build complete request body with all meal values
      const requestBody: any = {
        studentId,
        date,
        breakfast: currentMealRecord?.breakfast || false,
        lunch: currentMealRecord?.lunch || false,
        dinner: currentMealRecord?.dinner || false,
        present: currentMealRecord?.present || false,
        [mealType]: value
      }

      const response = await fetch('/api/mando-meal-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedRecord = await response.json()

        // Update local state
        setLocalStudents(prev => prev.map(student => {
          if (student.id === studentId) {
            const existingIndex = student.meals.findIndex(m => m.date.startsWith(date))
            if (existingIndex >= 0) {
              // Update existing
              student.meals[existingIndex] = updatedRecord
            } else {
              // Add new
              student.meals.push(updatedRecord)
            }
          }
          return student
        }))
      }
    } catch (error) {
      console.error('Error updating meal:', error)
    }
  }

  const getMealForDate = (student: Student, day: number) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
    return student.meals.find((meal) => meal.date.startsWith(dateStr))
  }

  const getMealStyle = (meal: boolean) => {
    return meal
      ? { bg: "bg-green-500", text: "text-white" }
      : { bg: "bg-gray-100", text: "text-gray-400" }
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

  const handleMealToggle = async (studentId: string, day: number, mealType: "breakfast" | "lunch" | "dinner" | "present", checked: boolean | "indeterminate") => {
    const isChecked = checked === true
    const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`
    await updateMeal(studentId, dateStr, mealType, isChecked)
  }


  return (
    <Card className="p-6 border-0 shadow-md max-w-screen-xl">
      {/* Meal Entry Table */}
      <div className="overflow-x-auto border rounded-lg">
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
                              "h-8 w-full text-xs font-semibold rounded-sm",
                              mealCount > 0
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
                                : "text-muted-foreground/30 hover:bg-muted"
                            )}
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
                              <div className="flex items-center space-x-3 pt-2 border-t">
                                <Checkbox
                                  id={`present-${student.id}-${day}`}
                                  checked={mealRecord?.present || false}
                                  onCheckedChange={(checked) => handleMealToggle(student.id, day, "present", checked)}
                                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                />
                                <label htmlFor={`present-${student.id}-${day}`} className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                  Mark Present
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
        <p>• Click on a day cell to open the meal selection popup</p>
        <p>• Check/uncheck the boxes for Breakfast, Lunch, Dinner, and Present</p>
        <p>• The cell shows a summary of selected meals (e.g., "B,L,P (3)" means 3 meals eaten)</p>
      </div>
    </Card>
  )
}
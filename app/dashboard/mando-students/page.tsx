"use client"

import { useState } from "react"
import { MealEntryCalendar } from "@/components/meal-entry/meal-entry-calendar"
import { MealEntryActions } from "@/components/meal-entry/meal-entry-actions"

export const dynamic = 'force-dynamic'

export default function MealEntryPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const year = typeof searchParams.year === 'string' ? searchParams.year : currentYear.toString()
  const month = typeof searchParams.month === 'string' ? searchParams.month : currentMonth.toString()

  const [mealStudents, setMealStudents] = useState<any[]>([])

  const exportMealDataToCSV = () => {
    const monthName = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(month)]
    const filename = `meal-entry-${year}-${monthName}.csv`

    // Get days in month
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Header
    const header = ["Year", "Month", "Student", "Company ID"]
    days.forEach(day => {
      header.push(`${day}B`, `${day}L`, `${day}D`)
    })
    header.push("Total Meals")

    const params = [header]

    // Student data
    mealStudents.forEach(student => {
      const row = [
        year,
        monthName,
        student.name,
        student.companyId || "Not Set"
      ]

      let totalMeals = 0
      days.forEach(day => {
        const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        const mealRecord = student.meals.find((meal: any) => meal.date.startsWith(dateStr))

        if (mealRecord) {
          row.push(mealRecord.breakfast ? "B" : "-")
          row.push(mealRecord.lunch ? "L" : "-")
          row.push(mealRecord.dinner ? "D" : "-")
          totalMeals += (mealRecord.breakfast ? 1 : 0) + (mealRecord.lunch ? 1 : 0) + (mealRecord.dinner ? 1 : 0)
        } else {
          row.push("-", "-", "-")
        }
      })

      row.push(totalMeals.toString())
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meal Entry - Mando Students</h1>
          <p className="text-slate-600">Track meal consumption (B=Breakfast, L=Lunch, D=Dinner) for mando students</p>
        </div>
        <MealEntryActions onExport={exportMealDataToCSV} />
      </div>

      {/* Meal Entry Calendar */}
      <MealEntryCalendar year={year} month={month} onExport={exportMealDataToCSV} onStudentsChange={setMealStudents} />
    </div>
  )
}
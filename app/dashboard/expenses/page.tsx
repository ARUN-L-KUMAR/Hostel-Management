"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { ExpensesActions } from "@/components/expenses/expenses-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { YearPicker } from "@/components/ui/year-picker"

export default function ExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = searchParams.get('year') || currentYear.toString()
  const month = searchParams.get('month') || currentMonth.toString()

  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', newYear)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleMonthChange = (newMonth: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonth)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleTableRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Management</h1>
          <p className="text-slate-600">Track and manage mess expenses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <ExpensesActions onRefresh={handleTableRefresh} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-white border rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Period:</span>
          <YearPicker
            value={year}
            onValueChange={handleYearChange}
            className="w-32"
          />

          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses Table */}
      <ExpensesTable key={refreshTrigger} year={year} month={month} />
    </div>
  )
}
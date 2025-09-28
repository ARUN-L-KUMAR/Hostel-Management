"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { YearPicker } from "@/components/ui/year-picker"

export function MealEntryPeriodFilters() {
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

  return (
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
  )
}
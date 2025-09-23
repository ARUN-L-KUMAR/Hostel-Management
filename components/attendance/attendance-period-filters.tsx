"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function AttendancePeriodFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const attendanceYear = searchParams.get("year") || currentYear.toString()
  const attendanceMonth = searchParams.get("month") || currentMonth.toString()

  const [selectedYear, setSelectedYear] = useState(attendanceYear)
  const [selectedMonth, setSelectedMonth] = useState(attendanceMonth)

  useEffect(() => {
    setSelectedYear(attendanceYear)
    setSelectedMonth(attendanceMonth)
  }, [attendanceYear, attendanceMonth])

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-center space-x-4 pt-10">
      <div className="flex items-center space-x-2">
        <Label className="text-sm font-medium text-slate-700">Attendance Year:</Label>
        <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); updateSearchParams("year", value); }}>
          <SelectTrigger className="w-32 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Label className="text-sm font-medium text-slate-700">Attendance Month:</Label>
        <Select value={selectedMonth} onValueChange={(value) => { setSelectedMonth(value); updateSearchParams("month", value); }}>
          <SelectTrigger className="w-40 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="1">January</SelectItem>
            <SelectItem value="2">February</SelectItem>
            <SelectItem value="3">March</SelectItem>
            <SelectItem value="4">April</SelectItem>
            <SelectItem value="5">May</SelectItem>
            <SelectItem value="6">June</SelectItem>
            <SelectItem value="7">July</SelectItem>
            <SelectItem value="8">August</SelectItem>
            <SelectItem value="9">September</SelectItem>
            <SelectItem value="10">October</SelectItem>
            <SelectItem value="11">November</SelectItem>
            <SelectItem value="12">December</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
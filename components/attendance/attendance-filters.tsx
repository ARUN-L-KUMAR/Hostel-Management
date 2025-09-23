"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Filter, RotateCcw } from "lucide-react"

export function AttendanceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [hostelFilter, setHostelFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [mandoOnly, setMandoOnly] = useState(false)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // 1-12

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

  const handleReset = () => {
    setHostelFilter("all")
    setYearFilter("all")
    setMandoOnly(false)
    setSelectedYear(currentYear.toString())
    setSelectedMonth(currentMonth.toString())
    updateSearchParams("year", currentYear.toString())
    updateSearchParams("month", currentMonth.toString())
  }

  return (
    <Card className="p-4 border-0 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-900">Filters</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mt-4">
        {/* Hostel Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Hostel</Label>
          <Select value={hostelFilter} onValueChange={setHostelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select hostel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              <SelectItem value="boys">Boys Hostel</SelectItem>
              <SelectItem value="girls">Girls Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Academic Year</Label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attendance Year Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Attendance Year</Label>
          <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); updateSearchParams("year", value); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Attendance Month Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Attendance Month</Label>
          <Select value={selectedMonth} onValueChange={(value) => { setSelectedMonth(value); updateSearchParams("month", value); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
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

        {/* Mando Only Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Mando Students</Label>
          <div className="flex items-center space-x-2">
            <Switch id="mando-only" checked={mandoOnly} onCheckedChange={setMandoOnly} />
            <Label htmlFor="mando-only" className="text-sm text-slate-600">
              Show only Mando students
            </Label>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-medium text-slate-700">Quick Stats</Label>
          <div className="text-sm text-slate-600">
            <div>Total Students: 50</div>
            <div>Mando Students: 12</div>
            <div>Present Today: 47</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

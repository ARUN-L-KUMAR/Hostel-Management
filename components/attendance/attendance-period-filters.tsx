"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { YearPicker } from "@/components/ui/year-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter, Calendar } from "lucide-react"

export function AttendancePeriodFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // Attendance Period (Year/Month)
  const attendanceYear = searchParams.get("year") || currentYear.toString()
  const attendanceMonth = searchParams.get("month") || currentMonth.toString()

  const [selectedYear, setSelectedYear] = useState(attendanceYear)
  const [selectedMonth, setSelectedMonth] = useState(attendanceMonth)

  // Student Filters
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [hostel, setHostel] = useState(searchParams.get("hostel") || "all")
  const [academicYear, setAcademicYear] = useState(searchParams.get("yearFilter") || "all")
  const [dept, setDept] = useState(searchParams.get("dept") || "all")
  const [status, setStatus] = useState(searchParams.get("status") || "ACTIVE")

  useEffect(() => {
    setSelectedYear(attendanceYear)
    setSelectedMonth(attendanceMonth)
  }, [attendanceYear, attendanceMonth])

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all" && key !== "status") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    // Debounce search
    const timer = setTimeout(() => {
      updateSearchParams("search", value)
    }, 300)
    return () => clearTimeout(timer)
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Selection */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Period:</span>
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium text-muted-foreground">Year:</Label>
            <YearPicker
              value={selectedYear}
              onValueChange={(value) => { setSelectedYear(value); updateSearchParams("year", value); }}
              className="w-32"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium text-muted-foreground">Month:</Label>
            <Select value={selectedMonth} onValueChange={(value) => { setSelectedMonth(value); updateSearchParams("month", value); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
        </div>

        {/* Student Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <Input
              placeholder="Name or Roll No..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Hostel */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Hostel</label>
            <Select value={hostel} onValueChange={(v) => { setHostel(v); updateSearchParams("hostel", v); }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                <SelectItem value="Boys">Boys Hostel</SelectItem>
                <SelectItem value="Girls">Girls Hostel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Year</label>
            <Select value={academicYear} onValueChange={(v) => { setAcademicYear(v); updateSearchParams("yearFilter", v); }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Department</label>
            <Select value={dept} onValueChange={(v) => { setDept(v); updateSearchParams("dept", v); }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Dept" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="MECH">MECH</SelectItem>
                <SelectItem value="EEE">EEE</SelectItem>
                <SelectItem value="CIVIL">CIVIL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); updateSearchParams("status", v); }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="VACATE">Vacated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
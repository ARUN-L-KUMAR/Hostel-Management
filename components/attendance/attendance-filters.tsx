"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Filter, RotateCcw } from "lucide-react"

export function AttendanceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1 // 1-12

  const attendanceYear = searchParams.get("year") || currentYear.toString()
  const attendanceMonth = searchParams.get("month") || currentMonth.toString()
  const hostel = searchParams.get("hostel") || "all"
  const academicYear = searchParams.get("academicYear") || "all"
  const mandoFilter = searchParams.get("mandoFilter") || "all"

  const [selectedYear, setSelectedYear] = useState(attendanceYear)
  const [selectedMonth, setSelectedMonth] = useState(attendanceMonth)

  useEffect(() => {
    setSelectedYear(attendanceYear)
    setSelectedMonth(attendanceMonth)
  }, [attendanceYear, attendanceMonth])

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleReset = () => {
    updateSearchParams("hostel", "all")
    updateSearchParams("academicYear", "all")
    updateSearchParams("status", "all")
    updateSearchParams("mandoFilter", "all")
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Hostel Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Hostel</Label>
          <Select value={hostel} onValueChange={(value) => updateSearchParams("hostel", value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select hostel" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Hostels</SelectItem>
              <SelectItem value="Boys">Boys Hostel</SelectItem>
              <SelectItem value="Girls">Girls Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Year</Label>
          <Select value={academicYear} onValueChange={(value) => updateSearchParams("academicYear", value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Status</Label>
          <Select value={searchParams.get("status") || "all"} onValueChange={(value) => updateSearchParams("status", value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="VACATED">Vacated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mando Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Mando Filter</Label>
          <Select value={mandoFilter} onValueChange={(value) => updateSearchParams("mandoFilter", value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select mando filter" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="mando">Mando Students Only</SelectItem>
              <SelectItem value="regular">Regular Students Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}

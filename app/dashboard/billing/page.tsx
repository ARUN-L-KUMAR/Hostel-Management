"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, Filter, RotateCcw, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { computeMandays, AttendanceCode } from "@/lib/calculations"

interface StudentBillingData {
  id: string
  name: string
  rollNo: string
  dept: string | null
  hostel: string
  year?: number
  status?: string
  isMando?: boolean
  mandays: number
  laborCharge: number
  provisionCharge: number
  advancePaid: number
  totalAmount: number
}

interface BillingSettings {
  perDayRate: number
  provisionPerDayRate: number
  advancePerDayRate: number
}

export default function BillingPage() {
  const { toast } = useToast()

  // Sem wise states
  const [selectedStartYear, setSelectedStartYear] = useState(new Date().getFullYear().toString())
  const [selectedEndYear, setSelectedEndYear] = useState(new Date().getFullYear().toString())
  const [selectedStartMonth, setSelectedStartMonth] = useState("1")
  const [selectedEndMonth, setSelectedEndMonth] = useState("6")
  const [semLaborCharge, setSemLaborCharge] = useState(45)
  const [semProvisionCharge, setSemProvisionCharge] = useState(25)
  const [semAdvanceAmount, setSemAdvanceAmount] = useState(15000)
  const [updatingSem, setUpdatingSem] = useState(false)
  const [studentsSem, setStudentsSem] = useState<StudentBillingData[]>([])
  const [loadingStudentsSem, setLoadingStudentsSem] = useState(false)
  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    status: "all",
    mandoFilter: "all",
    dept: "all",
    search: "",
  })

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

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  const updateSemBillingSettings = async () => {
    setUpdatingSem(true)
    const startYear = parseInt(selectedStartYear)
    const endYear = parseInt(selectedEndYear)
    const startMonth = parseInt(selectedStartMonth)
    const endMonth = parseInt(selectedEndMonth)

    const periods: { year: number; month: number }[] = []

    if (startYear === endYear) {
      for (let m = startMonth; m <= endMonth; m++) {
        periods.push({ year: startYear, month: m })
      }
    } else {
      // From startMonth to Dec of startYear
      for (let m = startMonth; m <= 12; m++) {
        periods.push({ year: startYear, month: m })
      }
      // Jan to endMonth of endYear
      for (let m = 1; m <= endMonth; m++) {
        periods.push({ year: endYear, month: m })
      }
    }

    try {
      const promises = periods.map(async ({ year, month }) => {
        const response = await fetch('/api/billing/overview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year: year.toString(),
            month: month.toString(),
            perDayRate: semLaborCharge,
            provisionPerDayRate: semProvisionCharge,
            advancePerDayRate: 0, // Since advance is separate
          }),
        })
        if (!response.ok) {
          throw new Error(`Failed to update ${month}/${year}`)
        }
      })

      await Promise.all(promises)

      toast({
        title: "Settings Updated",
        description: `Billing parameters updated for the selected semester.`,
      })

      fetchSemStudentsData() // Refresh students data
    } catch (error) {
      console.error("Error updating sem settings:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update billing settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingSem(false)
    }
  }

  const filteredStudentsSem = studentsSem.filter((student) => {
    const matchesSearch =
      filters.search === "" ||
      student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(filters.search.toLowerCase())

    const matchesHostel = filters.hostel === "all" || student.hostel === filters.hostel

    const matchesYear = filters.year === "all" || student.year?.toString() === filters.year

    const matchesStatus = filters.status === "all" || student.status === filters.status

    const matchesDept = filters.dept === "all" || (student.dept && student.dept.toLowerCase().includes(filters.dept.toLowerCase()))

    const matchesMando = filters.mandoFilter === "all" ||
      (filters.mandoFilter === "mando" && student.isMando) ||
      (filters.mandoFilter === "regular" && !student.isMando)

    return matchesSearch && matchesHostel && matchesYear && matchesStatus && matchesDept && matchesMando
  })

  const fetchSemStudentsData = async () => {
    setLoadingStudentsSem(true)
    try {
      const startYear = parseInt(selectedStartYear)
      const endYear = parseInt(selectedEndYear)
      const startMonth = parseInt(selectedStartMonth)
      const endMonth = parseInt(selectedEndMonth)

      const startDate = new Date(startYear, startMonth - 1, 1)
      const endDate = new Date(endYear, endMonth, 1)

      // Get all students
      const studentsResponse = await fetch('/api/students')
      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students")
      }
      const students = await studentsResponse.json()

      // Get all attendance
      const attendanceResponse = await fetch('/api/attendance')
      if (!attendanceResponse.ok) {
        throw new Error("Failed to fetch attendance")
      }
      const allAttendance = await attendanceResponse.json()

      // For each student, filter attendance for the period and sum mandays
      const studentsData = []

      for (const student of students) {
        const studentAttendance = allAttendance.filter((att: any) =>
          att.studentId === student.id &&
          new Date(att.date) >= startDate &&
          new Date(att.date) < endDate
        )

        const attendanceRecords = studentAttendance.map((att: any) => ({
          code: att.code as AttendanceCode,
          date: new Date(att.date),
        }))

        const totalMandays = computeMandays(attendanceRecords)

        const laborCharge = totalMandays * semLaborCharge
        const provisionCharge = semProvisionCharge * totalMandays
        const advancePaid = semAdvanceAmount // Fixed amount, not per day
        const totalAmount = advancePaid - (laborCharge + provisionCharge)

        studentsData.push({
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          dept: student.dept,
          hostel: student.hostel?.name || 'Unknown',
          year: student.year,
          status: student.status,
          isMando: student.isMando,
          mandays: totalMandays,
          laborCharge,
          provisionCharge,
          advancePaid,
          totalAmount,
        })
      }

      setStudentsSem(studentsData)
    } catch (error) {
      console.error("Error fetching sem students data:", error)
    } finally {
      setLoadingStudentsSem(false)
    }
  }


  useEffect(() => {
    fetchSemStudentsData()
  }, [selectedStartYear, selectedStartMonth, selectedEndYear, selectedEndMonth])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Billing Overview</h1>
        <p className="text-slate-600">View and manage student payment amounts with labor, provision, and advance calculations</p>
      </div>

      <div className="space-y-6">
          {/* Sem Selection */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Semester Range Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="space-y-2">
                  <Label htmlFor="startYear">From Year</Label>
                  <Select value={selectedStartYear} onValueChange={setSelectedStartYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startMonth">From Month</Label>
                  <Select value={selectedStartMonth} onValueChange={setSelectedStartMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endYear">To Year</Label>
                  <Select value={selectedEndYear} onValueChange={setSelectedEndYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endMonth">To Month</Label>
                  <Select value={selectedEndMonth} onValueChange={setSelectedEndMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Parameters */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Billing Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Label htmlFor="semLabor">Labor Charge (per day)</Label>
                  <Label htmlFor="semProvision">Provision Charge (per day)</Label>
                  <Label htmlFor="semAdvance">Advance Amount</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    id="semLabor"
                    type="number"
                    step="0.01"
                    value={semLaborCharge}
                    onChange={(e) => setSemLaborCharge(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    id="semProvision"
                    type="number"
                    step="0.01"
                    value={semProvisionCharge}
                    onChange={(e) => setSemProvisionCharge(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    id="semAdvance"
                    type="number"
                    value={semAdvanceAmount}
                    onChange={(e) => setSemAdvanceAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={updateSemBillingSettings} disabled={updatingSem}>
                  <Save className="w-4 h-4 mr-2" />
                  {updatingSem ? "Updating..." : "Update Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* Filters */}
          <Card className="p-4 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-900">Filters</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFilters({
                hostel: "all",
                year: "all",
                status: "all",
                mandoFilter: "all",
                dept: "all",
                search: "",
              })}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Name or roll number..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Hostel Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Hostel</Label>
                <Select value={filters.hostel} onValueChange={(value) => setFilters(prev => ({ ...prev, hostel: value }))}>
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
                <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
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
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
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

              {/* Dept Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Dept</Label>
                <Select value={filters.dept} onValueChange={(value) => setFilters(prev => ({ ...prev, dept: value }))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Depts</SelectItem>
                    <SelectItem value="cse">CSE</SelectItem>
                    <SelectItem value="ece">ECE</SelectItem>
                    <SelectItem value="eee">EEE</SelectItem>
                    <SelectItem value="mech">Mech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mando Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Mando Filter</Label>
                <Select value={filters.mandoFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, mandoFilter: value }))}>
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

          {/* Students Table for Sem */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>
                Student Payment Overview - {(() => {
                  const startYear = parseInt(selectedStartYear)
                  const endYear = parseInt(selectedEndYear)
                  const startMonth = parseInt(selectedStartMonth)
                  const endMonth = parseInt(selectedEndMonth)

                  const startDate = new Date(startYear, startMonth - 1, 1)
                  const endDate = new Date(endYear, endMonth, 1)
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

                  const startMonthLabel = months.find(m => m.value === selectedStartMonth)?.label
                  const endMonthLabel = months.find(m => m.value === selectedEndMonth)?.label

                  return `${startMonthLabel} ${startYear} to ${endMonthLabel} ${endYear} (${totalDays} days)`
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead className="text-right">Mandays</TableHead>
                    <TableHead className="text-right">Labor Charge</TableHead>
                    <TableHead className="text-right">Provision Charges</TableHead>
                    <TableHead className="text-right">Advance Paid</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentsSem.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-sm text-slate-500">{student.rollNo}</div>
                        </div>
                      </TableCell>
                      <TableCell>{student.dept || 'Not Set'}</TableCell>
                      <TableCell>{student.hostel}</TableCell>
                      <TableCell className="text-right">{student.mandays}</TableCell>
                      <TableCell className="text-right">₹{student.laborCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{student.provisionCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{student.advancePaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={student.totalAmount >= 0 ? "default" : "destructive"}
                          className={student.totalAmount >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          ₹{student.totalAmount.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

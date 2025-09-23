"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StudentBillingData {
  id: string
  name: string
  rollNo: string
  dept: string | null
  hostel: string
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

  const fetchSemStudentsData = async () => {
    setLoadingStudentsSem(true)
    try {
      const response = await fetch(`/api/billing/overview?year=${selectedStartYear}&month=${selectedStartMonth}`)
      if (!response.ok) {
        throw new Error("Failed to fetch billing data")
      }
      const data = await response.json()
      setStudentsSem(data.students)
    } catch (error) {
      console.error("Error fetching sem students data:", error)
    } finally {
      setLoadingStudentsSem(false)
    }
  }


  useEffect(() => {
    fetchSemStudentsData()
  }, [selectedStartYear, selectedStartMonth])

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


          {/* Students Table for Sem */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Student Payment Overview - {months.find(m => m.value === selectedStartMonth)?.label} {selectedStartYear}</CardTitle>
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
                  {studentsSem.map((student) => (
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

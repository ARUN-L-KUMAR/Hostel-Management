"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StudentBillingData {
  id: string
  name: string
  rollNo: string
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [billingSettings, setBillingSettings] = useState<BillingSettings>({
    perDayRate: 49.48,
    provisionPerDayRate: 25.00,
    advancePerDayRate: 18.75,
  })
  const [students, setStudents] = useState<StudentBillingData[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Sem wise states
  const [selectedStartYear, setSelectedStartYear] = useState(new Date().getFullYear().toString())
  const [selectedEndYear, setSelectedEndYear] = useState(new Date().getFullYear().toString())
  const [selectedStartMonth, setSelectedStartMonth] = useState("1")
  const [selectedEndMonth, setSelectedEndMonth] = useState("6")
  const [billingSettingsSem, setBillingSettingsSem] = useState<Record<string, BillingSettings>>({})
  const [loadingSem, setLoadingSem] = useState(false)
  const [updatingSem, setUpdatingSem] = useState<Record<string, boolean>>({})
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

  const fetchBillingData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/billing/overview?year=${selectedYear}&month=${selectedMonth}`)
      if (!response.ok) {
        throw new Error("Failed to fetch billing data")
      }
      const data = await response.json()

      setBillingSettings({
        perDayRate: data.bill.perDayRate,
        provisionPerDayRate: data.bill.provisionPerDayRate || 25.00,
        advancePerDayRate: data.bill.advancePerDayRate || 18.75,
      })

      setStudents(data.students)
    } catch (error) {
      console.error("Error fetching billing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSemBillingData = async () => {
    setLoadingSem(true)
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

    const settings: Record<string, BillingSettings> = {}

    try {
      const promises = periods.map(async ({ year, month }) => {
        const response = await fetch(`/api/billing/overview?year=${year}&month=${month}`)
        const key = `${year}-${month}`
        if (response.ok) {
          const data = await response.json()
          settings[key] = {
            perDayRate: data.bill.perDayRate,
            provisionPerDayRate: data.bill.provisionPerDayRate || 25.00,
            advancePerDayRate: data.bill.advancePerDayRate || 18.75,
          }
        } else {
          // Default values if not found
          settings[key] = {
            perDayRate: 49.48,
            provisionPerDayRate: 25.00,
            advancePerDayRate: 18.75,
          }
        }
      })

      await Promise.all(promises)
      setBillingSettingsSem(settings)
    } catch (error) {
      console.error("Error fetching sem billing data:", error)
    } finally {
      setLoadingSem(false)
    }
  }

  const updateBillingSettings = async () => {
    setUpdating(true)
    try {
      const response = await fetch('/api/billing/overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          perDayRate: billingSettings.perDayRate,
          provisionPerDayRate: billingSettings.provisionPerDayRate,
          advancePerDayRate: billingSettings.advancePerDayRate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update billing settings")
      }

      toast({
        title: "Settings Updated",
        description: "Billing parameters have been successfully updated.",
      })

      fetchBillingData() // Refresh data with new settings
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update billing settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
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

  const updateSemBillingSettings = async (year: string, month: string) => {
    const key = `${year}-${month}`
    setUpdatingSem(prev => ({ ...prev, [key]: true }))
    try {
      const settings = billingSettingsSem[key]
      const response = await fetch('/api/billing/overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month,
          perDayRate: settings.perDayRate,
          provisionPerDayRate: settings.provisionPerDayRate,
          advancePerDayRate: settings.advancePerDayRate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update billing settings")
      }

      toast({
        title: "Settings Updated",
        description: `Billing parameters for ${months.find(m => m.value === month)?.label} ${year} have been successfully updated.`,
      })

      fetchSemBillingData() // Refresh data
    } catch (error) {
      console.error("Error updating sem settings:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update billing settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingSem(prev => ({ ...prev, [key]: false }))
    }
  }

  useEffect(() => {
    fetchBillingData()
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    fetchSemBillingData()
  }, [selectedStartYear, selectedEndYear, selectedStartMonth, selectedEndMonth])

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

      <Tabs defaultValue="month" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="month"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 rounded-md px-4 py-2 transition-all"
          >
            Month wise
          </TabsTrigger>
          <TabsTrigger
            value="sem"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 rounded-md px-4 py-2 transition-all"
          >
            Sem wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-6">
          {/* Month Selection */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Month Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
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
                  <Label htmlFor="month">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
                <div className="flex items-end">
                  <Button variant="outline" onClick={fetchBillingData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Update */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Update Billing Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Label htmlFor="perDayRate" className="text-center">Labor Charge (per day)</Label>
                  <Label htmlFor="provisionPerDayRate" className="text-center">Provision Charge (per day)</Label>
                  <Label htmlFor="advancePerDayRate" className="text-center">Advance Amount (per day)</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    id="perDayRate"
                    type="number"
                    step="0.01"
                    value={billingSettings.perDayRate}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, perDayRate: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    id="provisionPerDayRate"
                    type="number"
                    step="0.01"
                    value={billingSettings.provisionPerDayRate}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, provisionPerDayRate: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    id="advancePerDayRate"
                    type="number"
                    step="0.01"
                    value={billingSettings.advancePerDayRate}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, advancePerDayRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={updateBillingSettings} disabled={updating}>
                  <Save className="w-4 h-4 mr-2" />
                  {updating ? "Updating..." : "Update Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Student Payment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead className="text-right">Mandays</TableHead>
                    <TableHead className="text-right">Labor Charge</TableHead>
                    <TableHead className="text-right">Provision Charges</TableHead>
                    <TableHead className="text-right">Advance Paid</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-sm text-slate-500">{student.rollNo}</div>
                        </div>
                      </TableCell>
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

        </TabsContent>

        <TabsContent value="sem" className="space-y-6">
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
                <div className="flex items-end">
                  <Button variant="outline" onClick={fetchSemBillingData} disabled={loadingSem}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingSem ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Parameters for each month - Compact Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Billing Parameters Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Labor Charge (per day)</TableHead>
                    <TableHead className="text-right">Provision Charge (per day)</TableHead>
                    <TableHead className="text-right">Advance Amount (per day)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
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
                      for (let m = startMonth; m <= 12; m++) {
                        periods.push({ year: startYear, month: m })
                      }
                      for (let m = 1; m <= endMonth; m++) {
                        periods.push({ year: endYear, month: m })
                      }
                    }

                    return periods.map(({ year, month }) => {
                      const monthStr = month.toString()
                      const monthLabel = months.find(m => m.value === monthStr)?.label
                      const key = `${year}-${month}`
                      const settings = billingSettingsSem[key] || {
                        perDayRate: 49.48,
                        provisionPerDayRate: 25.00,
                        advancePerDayRate: 18.75,
                      }
                      const isUpdating = updatingSem[key]

                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{monthLabel} {year}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={settings.perDayRate}
                              onChange={(e) => setBillingSettingsSem(prev => ({
                                ...prev,
                                [key]: { ...prev[key], perDayRate: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={settings.provisionPerDayRate}
                              onChange={(e) => setBillingSettingsSem(prev => ({
                                ...prev,
                                [key]: { ...prev[key], provisionPerDayRate: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={settings.advancePerDayRate}
                              onChange={(e) => setBillingSettingsSem(prev => ({
                                ...prev,
                                [key]: { ...prev[key], advancePerDayRate: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => updateSemBillingSettings(year.toString(), monthStr)} disabled={isUpdating}>
                              <Save className="w-4 h-4 mr-1" />
                              {isUpdating ? "Updating..." : "Update"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  })()}
                </TableBody>
              </Table>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

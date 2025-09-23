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

  useEffect(() => {
    fetchBillingData()
  }, [selectedYear, selectedMonth])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Billing Overview</h1>
        <p className="text-slate-600">View and manage student payment amounts with labor, provision, and advance calculations</p>
      </div>

      {/* Filters */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="perDayRate">Labor Charge (per day)</Label>
              <Input
                id="perDayRate"
                type="number"
                step="0.01"
                value={billingSettings.perDayRate}
                onChange={(e) => setBillingSettings(prev => ({ ...prev, perDayRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provisionPerDayRate">Provision Charge (per day)</Label>
              <Input
                id="provisionPerDayRate"
                type="number"
                step="0.01"
                value={billingSettings.provisionPerDayRate}
                onChange={(e) => setBillingSettings(prev => ({ ...prev, provisionPerDayRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advancePerDayRate">Advance Amount (per day)</Label>
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
    </div>
  )
}

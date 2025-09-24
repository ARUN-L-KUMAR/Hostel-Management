"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Package, Users, UserCheck } from "lucide-react"
import { toast } from "sonner"

interface ReportData {
  provisions: {
    totalCost: number
    purchases: Array<{
      id: string
      date: string
      vendor: string
      totalAmount: number
    }>
  }
  outsiders: {
    totalMeals: number
    totalCost: number
    mealRate: number
    records: Array<{
      id: number
      date: string
      breakfast: boolean
      lunch: boolean
      dinner: boolean
      outsider: { name: string; phone: string | null }
    }>
  }
  mando: {
    totalMeals: number
    totalCost: number
    mealRate: number
    records: Array<{
      id: number
      date: string
      breakfast: boolean
      lunch: boolean
      dinner: boolean
      student: { name: string; rollNo: string }
    }>
  }
}

export default function ReportsPage() {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString())
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mealRates, setMealRates] = useState({ outsiders: 50, mando: 50 })

  const fetchMealRates = async () => {
    try {
      const response = await fetch('/api/meal-rates')
      const rates = await response.json()
      setMealRates(rates)
    } catch (error) {
      console.error("Error fetching meal rates:", error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year: selectedYear, month: selectedMonth })

      // Fetch all data in parallel
      const [provisionsRes, outsidersRes, mandoRes] = await Promise.all([
        fetch(`/api/provision-purchases?${params}`),
        fetch(`/api/outsider-meal-records?${params}`),
        fetch(`/api/mando-meal-records?${params}`)
      ])

      const [provisionsData, outsidersData, mandoData] = await Promise.all([
        provisionsRes.json(),
        outsidersRes.json(),
        mandoRes.json()
      ])

      // Calculate totals
      const provisionsTotal = provisionsData.reduce((sum: number, item: any) => sum + parseFloat(item.totalAmount || 0), 0)

      const outsidersMeals = outsidersData.reduce((sum: number, record: any) =>
        sum + (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0), 0)

      const mandoMeals = mandoData.reduce((sum: number, record: any) =>
        sum + (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0), 0)

      setReportData({
        provisions: {
          totalCost: provisionsTotal,
          purchases: provisionsData
        },
        outsiders: {
          totalMeals: outsidersMeals,
          totalCost: outsidersMeals * mealRates.outsiders,
          mealRate: mealRates.outsiders,
          records: outsidersData
        },
        mando: {
          totalMeals: mandoMeals,
          totalCost: mandoMeals * mealRates.mando,
          mealRate: mealRates.mando,
          records: mandoData
        }
      })
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast.error("Failed to load report data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMealRates()
  }, [])

  useEffect(() => {
    if (mealRates.outsiders && mealRates.mando) {
      fetchReportData()
    }
  }, [selectedYear, selectedMonth, mealRates])

  const handleEditRates = async () => {
    try {
      const response = await fetch('/api/meal-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealRates)
      })

      if (response.ok) {
        const updatedRates = await response.json()
        setMealRates(updatedRates)
        toast.success("Meal rates updated successfully")
      } else {
        toast.error("Failed to update meal rates")
      }
    } catch (error) {
      console.error("Error updating meal rates:", error)
      toast.error("Failed to update meal rates")
    }
    setEditDialogOpen(false)
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Reports</h1>
          <p className="text-muted-foreground">Independent cost reports for each category</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Label>Year:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label>Month:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Rates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Meal Rates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="outsiders-rate">Outsiders Meal Rate (₹)</Label>
                  <Input
                    id="outsiders-rate"
                    type="number"
                    value={mealRates.outsiders}
                    onChange={(e) => setMealRates(prev => ({ ...prev, outsiders: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mando-rate">Mando Meal Rate (₹)</Label>
                  <Input
                    id="mando-rate"
                    type="number"
                    value={mealRates.mando}
                    onChange={(e) => setMealRates(prev => ({ ...prev, mando: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditRates}>
                    Save Rates
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-slate-600">Loading report data...</span>
        </div>
      ) : reportData ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Provisions Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Provisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">
                  ₹{reportData.provisions.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reportData.provisions.purchases.length} purchases
                </div>
                <div className="space-y-2">
                  {reportData.provisions.purchases.slice(0, 3).map((purchase: any) => (
                    <div key={purchase.id} className="flex justify-between text-sm">
                      <span className="truncate">{purchase.vendor}</span>
                      <span>₹{parseFloat(purchase.totalAmount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outsiders Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Outsiders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-green-600">
                  ₹{reportData.outsiders.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reportData.outsiders.totalMeals} meals × ₹{reportData.outsiders.mealRate}
                </div>
                <div className="space-y-2">
                  {reportData.outsiders.records.slice(0, 3).map((record: any) => (
                    <div key={record.id} className="flex justify-between text-sm">
                      <span className="truncate">{record.outsider?.name}</span>
                      <span>{(record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)} meals</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mando Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-orange-600" />
                Mando Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-orange-600">
                  ₹{reportData.mando.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reportData.mando.totalMeals} meals × ₹{reportData.mando.mealRate}
                </div>
                <div className="space-y-2">
                  {reportData.mando.records.slice(0, 3).map((record: any) => (
                    <div key={record.id} className="flex justify-between text-sm">
                      <span className="truncate">{record.student?.name}</span>
                      <span>{(record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)} meals</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No data available for the selected period
        </div>
      )}
    </div>
  )
}

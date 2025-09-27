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
    byGender?: {
      [genderName: string]: {
        meals: number
        cost: number
      }
    }
  }
}

export default function ReportsPage() {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString())
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mealRates, setMealRates] = useState({ outsiders: 0, mando: 0 })
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const fetchMealRates = async () => {
    try {
      console.log('Fetching meal rates...')
      // Add a timestamp to prevent caching
      const response = await fetch(`/api/meal-rates?t=${Date.now()}`)
      console.log('Response status:', response.status)
      console.log('Response headers:', [...response.headers.entries()])
      const rates = await response.json()
      console.log('Fetched meal rates from API:', rates)
      console.log('Current mealRates state before update:', mealRates)
      setMealRates(rates)
      console.log('Called setMealRates with:', rates)

      // Return the rates so we can use them immediately
      return rates
    } catch (error) {
      console.error("Error fetching meal rates:", error)
      return null
    }
  }
  
  // Add a useEffect to log when mealRates changes
  useEffect(() => {
    console.log('mealRates updated:', mealRates)
  }, [mealRates])

  const fetchReportData = async (rates: { outsiders: number; mando: number }) => {
    console.log('fetchReportData called with mealRates:', rates)
    console.log('Current mealRates state:', mealRates)
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

      console.log('Fetched data - outsidersData length:', outsidersData.length, 'mandoData length:', mandoData.length)

      // Calculate totals
      const provisionsTotal = provisionsData.reduce((sum: number, item: any) => sum + parseFloat(item.totalAmount || 0), 0)

      const outsidersMeals = outsidersData.reduce((sum: number, record: any) =>
        sum + (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0), 0)

      console.log('Calculated outsidersMeals:', outsidersMeals, 'using rates.outsiders:', rates.outsiders)

      // Calculate mando meals by gender (boys/girls)
      const mandoMealsByGender = mandoData.reduce((acc: any, record: any) => {
        const gender = record.student?.gender
        const genderName = gender === 'M' ? 'Boys' : gender === 'G' ? 'Girls' : 'Unknown'
        const meals = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)

        if (!acc[genderName]) {
          acc[genderName] = { meals: 0, cost: 0 }
        }
        acc[genderName].meals += meals
        acc[genderName].cost += meals * rates.mando

        return acc
      }, {})

      const totalMandoMeals = Object.values(mandoMealsByGender).reduce((sum: number, gender: any) => sum + gender.meals, 0)
      const totalMandoCost = Object.values(mandoMealsByGender).reduce((sum: number, gender: any) => sum + gender.cost, 0)

      console.log('Calculated mandoMealsByGender:', mandoMealsByGender, 'using rates.mando:', rates.mando)
      console.log('Total mando cost:', totalMandoCost, 'total mando meals:', totalMandoMeals)

      setReportData({
        provisions: {
          totalCost: provisionsTotal,
          purchases: provisionsData
        },
        outsiders: {
          totalMeals: outsidersMeals,
          totalCost: outsidersMeals * rates.outsiders,
          mealRate: rates.outsiders,
          records: outsidersData
        },
        mando: {
          totalMeals: totalMandoMeals,
          totalCost: totalMandoCost,
          mealRate: rates.mando,
          records: mandoData,
          byGender: mandoMealsByGender
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
    console.log('useEffect triggered with selectedYear:', selectedYear, 'selectedMonth:', selectedMonth)
    let cancelled = false;
    
    const loadData = async () => {
      console.log('Loading data...')
      const rates = await fetchMealRates()
      console.log('Rates fetched:', rates)
      if (rates && !cancelled) {
        // Now fetch report data with the loaded rates
        await fetchReportData(rates) // Use the fetched rates directly
      }
      if (!cancelled) {
        setInitialLoadComplete(true)
      }
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [selectedYear, selectedMonth])

  const handleEditRates = async () => {
    console.log('Saving meal rates:', mealRates)
    try {
      console.log('Sending PUT request with body:', JSON.stringify(mealRates))
      const response = await fetch('/api/meal-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealRates)
      })

      console.log('API response status:', response.status)
      console.log('API response headers:', [...response.headers.entries()])
      if (response.ok) {
        const updatedRates = await response.json()
        console.log('Updated rates from API:', updatedRates)
        setMealRates(updatedRates)
        // Refresh the report data with the new rates
        await fetchReportData(updatedRates) // Use the updated rates directly
        toast.success("Meal rates updated successfully")
      } else {
        const errorText = await response.text()
        console.error('API error:', errorText)
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
            <DialogContent className="max-w-md bg-white">
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
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 0
                      console.log('Outsiders rate changed to:', newValue)
                      setMealRates(prev => ({ ...prev, outsiders: newValue }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mando-rate">Mando Meal Rate (₹)</Label>
                  <Input
                    id="mando-rate"
                    type="number"
                    value={mealRates.mando}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 0
                      console.log('Mando rate changed to:', newValue)
                      setMealRates(prev => ({ ...prev, mando: newValue }))
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Current values: Mando: {mealRates.mando}, Outsiders: {mealRates.outsiders}
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

      {loading || !initialLoadComplete ? (
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
                  Total provision purchases for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
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
                {reportData.mando.byGender && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {Object.entries(reportData.mando.byGender).map(([genderName, data]: [string, any]) => (
                      <div key={genderName} className="flex justify-between text-sm">
                        <span className="text-slate-600">{genderName}:</span>
                        <span>{data.meals} meals (₹{data.cost.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                )}
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

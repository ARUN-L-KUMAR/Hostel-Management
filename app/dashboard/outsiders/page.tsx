"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { AddOutsiderMealDialog } from "@/components/outsiders/add-outsider-meal-dialog"

interface MealRecord {
  id: number
  outsiderId: number
  date: string
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  mealRate: number
  outsider: {
    id: number
    name: string
    phone: string | null
  }
}

export default function OutsidersPage() {
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Filter states
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString())

  useEffect(() => {
    const fetchMealRecords = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedMonth) params.append('month', selectedMonth)
        if (selectedYear) params.append('year', selectedYear)

        const response = await fetch(`/api/outsider-meal-records?${params.toString()}`)
        const data = await response.json()
        setMealRecords(data)
      } catch (error) {
        console.error("Error fetching outsider meal records:", error)
        setMealRecords([])
      } finally {
        setLoading(false)
      }
    }

    fetchMealRecords()
  }, [selectedYear, selectedMonth])

  const refreshData = async () => {
    try {
      const response = await fetch('/api/outsider-meal-records')
      const data = await response.json()
      setMealRecords(data)
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  const getMealsText = (record: MealRecord) => {
    const meals = []
    if (record.breakfast) meals.push('B')
    if (record.lunch) meals.push('L')
    if (record.dinner) meals.push('D')
    return meals.join(', ') || 'None'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-slate-600">Loading meal history...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outsiders Meal History</h1>
          <p className="text-slate-600">View and manage outsider meal records</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Meal Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>Add Outsider Meal Record</DialogTitle>
            </DialogHeader>
            <AddOutsiderMealDialog
              onClose={() => {
                setAddDialogOpen(false)
                refreshData()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Year:</label>
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
          <label className="text-sm font-medium">Month:</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
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

      {/* Meal Records Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Meal Records ({mealRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mealRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No meal records found.
                  </TableCell>
                </TableRow>
              ) : (
                mealRecords.map((record) => {
                  const mealCount = [record.breakfast, record.lunch, record.dinner].filter(Boolean).length
                  const total = mealCount * record.mealRate

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.outsider?.name || 'Unknown'}</TableCell>
                      <TableCell>{record.outsider?.phone || 'N/A'}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getMealsText(record)}</Badge>
                      </TableCell>
                      <TableCell>₹{record.mealRate}</TableCell>
                      <TableCell className="font-medium">₹{total}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
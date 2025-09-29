"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  DollarSign,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface DashboardData {
  currentMonth: {
    year: number
    month: number
    monthName: string
    daysInMonth: number
    currentDay: number
  }
  kpis: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    totalStudents: number
    activeStudents: number
    totalMeals: number
    inventoryValue: number
  }
  expenses: {
    total: number
    byCategory: Array<{
      category: string
      amount: number
      percentage: number
      count: number
    }>
    recent: Array<{
      id: string
      name: string
      type: string
      amount: number
      date: string
    }>
  }
  provisions: {
    purchases: number
    usage: number
    inventory: number
    topItems: Array<{
      name: string
      purchased: number
      used: number
      remaining: number
      value: number
    }>
  }
  meals: {
    regularStudents: {
      total: number
      cost: number
      averagePerDay: number
    }
    mandoStudents: {
      total: number
      cost: number
      byGender: {
        boys: { meals: number; cost: number }
        girls: { meals: number; cost: number }
      }
    }
    outsiders: {
      total: number
      cost: number
      memberCount: number
    }
  }
  attendance: {
    averageAttendance: number
    totalPresent: number
    totalAbsent: number
    attendanceRate: number
  }
  alerts: Array<{
    type: 'warning' | 'info' | 'success'
    title: string
    message: string
  }>
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      // Fetch all dashboard data in parallel
      const [
        expensesRes,
        provisionsRes,
        provisionUsageRes,
        provisionItemsRes,
        attendanceRes,
        studentsRes,
        mandoMealRecordsRes,
        outsiderMealRecordsRes
      ] = await Promise.all([
        fetch(`/api/expenses?year=${year}&month=${month}`),
        fetch(`/api/provision-purchases?year=${year}&month=${month}`),
        fetch(`/api/provision-usage?startDate=${year}-${month.toString().padStart(2, '0')}-01&endDate=${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`),
        fetch('/api/provisions'),
        fetch('/api/attendance'),
        fetch('/api/students'),
        fetch(`/api/mando-meal-records?year=${year}&month=${month}`),
        fetch(`/api/outsider-meal-records?year=${year}&month=${month}`)
      ])

      const [
        expensesData,
        provisionsData,
        provisionUsageData,
        provisionItemsData,
        attendanceData,
        studentsData,
        mandoMealRecordsData,
        outsiderMealRecordsData
      ] = await Promise.all([
        expensesRes.json(),
        provisionsRes.json(),
        provisionUsageRes.json(),
        provisionItemsRes.json(),
        attendanceRes.json(),
        studentsRes.json(),
        mandoMealRecordsRes.json(),
        outsiderMealRecordsRes.json()
      ])

      // Calculate KPIs
      const totalExpenses = expensesData.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0)
      const totalProvisionsPurchased = provisionsData.reduce((sum: number, prov: any) => sum + parseFloat(prov.totalAmount || 0), 0)
      const totalProvisionUsage = provisionUsageData.reduce((sum: number, usage: any) => sum + (parseFloat(usage.quantity || 0) * parseFloat(usage.provisionItem?.unitCost || 0)), 0)

      // Calculate inventory value
      const inventoryValue = provisionItemsData.reduce((sum: number, item: any) => {
        const purchased = provisionsData.reduce((pSum: number, purchase: any) => {
          const itemPurchases = purchase.items?.filter((pi: any) => pi.provisionItem?.id === item.id) || []
          return pSum + itemPurchases.reduce((ipSum: number, pi: any) => ipSum + parseFloat(pi.quantity || 0), 0)
        }, 0)

        const used = provisionUsageData.reduce((uSum: number, usage: any) => {
          return usage.provisionItem?.id === item.id ? uSum + parseFloat(usage.quantity || 0) : uSum
        }, 0)

        const remaining = purchased - used
        return sum + (remaining * parseFloat(item.unitCost || 0))
      }, 0)

      // Calculate meals data
      const mandoMeals = mandoMealRecordsData.reduce((acc: any, record: any) => {
        const meals = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)
        const gender = record.student?.gender === 'M' ? 'boys' : 'girls'
        acc.total += meals
        acc.byGender[gender].meals += meals
        return acc
      }, { total: 0, byGender: { boys: { meals: 0 }, girls: { meals: 0 } } })

      const outsiderMeals = outsiderMealRecordsData.reduce((acc: any, record: any) => {
        const meals = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)
        acc.total += meals * (record.memberCount || 1)
        acc.memberCount += (record.memberCount || 1)
        return acc
      }, { total: 0, memberCount: 0 })

      // Calculate attendance
      const currentMonthAttendance = attendanceData.filter((att: any) => {
        const attDate = new Date(att.date)
        return attDate.getFullYear() === year && attDate.getMonth() + 1 === month
      })

      const totalPresent = currentMonthAttendance.filter((att: any) => att.code === 'P').length
      const totalAbsent = currentMonthAttendance.filter((att: any) => att.code === 'A').length
      const attendanceRate = currentMonthAttendance.length > 0 ? (totalPresent / currentMonthAttendance.length) * 100 : 0

      // Calculate expenses by category
      const expensesByCategory = expensesData.reduce((acc: any, exp: any) => {
        const category = exp.type || 'Other'
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 }
        }
        acc[category].amount += parseFloat(exp.amount || 0)
        acc[category].count += 1
        return acc
      }, {})

      const expensesByCategoryArray = Object.entries(expensesByCategory).map(([category, data]: [string, any]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        count: data.count
      })).sort((a, b) => b.amount - a.amount)

      // Create alerts
      const alerts = []
      if (inventoryValue < 10000) {
        alerts.push({
          type: 'warning' as const,
          title: 'Low Inventory Alert',
          message: `Inventory value is ₹${inventoryValue.toLocaleString()}. Consider restocking provisions.`
        })
      }
      if (attendanceRate < 70) {
        alerts.push({
          type: 'warning' as const,
          title: 'Low Attendance Rate',
          message: `Current attendance rate is ${attendanceRate.toFixed(1)}%. Monitor student attendance.`
        })
      }
      if (totalExpenses > 50000) {
        alerts.push({
          type: 'info' as const,
          title: 'High Expenses',
          message: `Monthly expenses have exceeded ₹50,000. Review expense categories.`
        })
      }

      const dashboardData: DashboardData = {
        currentMonth: {
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
          daysInMonth: new Date(year, month, 0).getDate(),
          currentDay: currentDate.getDate()
        },
        kpis: {
          totalIncome: 0, // Will be calculated from fee records
          totalExpenses: totalExpenses + totalProvisionUsage,
          netProfit: 0, // Will be calculated
          profitMargin: 0, // Will be calculated
          totalStudents: studentsData.length,
          activeStudents: studentsData.filter((s: any) => s.status === 'ACTIVE').length,
          totalMeals: mandoMeals.total + outsiderMeals.total,
          inventoryValue
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategoryArray,
          recent: expensesData.slice(0, 5).map((exp: any) => ({
            id: exp.id,
            name: exp.name,
            type: exp.type,
            amount: parseFloat(exp.amount || 0),
            date: exp.date
          }))
        },
        provisions: {
          purchases: totalProvisionsPurchased,
          usage: totalProvisionUsage,
          inventory: inventoryValue,
          topItems: provisionItemsData.slice(0, 5).map((item: any) => {
            const purchased = provisionsData.reduce((sum: number, purchase: any) => {
              const itemPurchases = purchase.items?.filter((pi: any) => pi.provisionItem?.id === item.id) || []
              return sum + itemPurchases.reduce((iSum: number, pi: any) => iSum + parseFloat(pi.quantity || 0), 0)
            }, 0)

            const used = provisionUsageData.reduce((sum: number, usage: any) => {
              return usage.provisionItem?.id === item.id ? sum + parseFloat(usage.quantity || 0) : sum
            }, 0)

            return {
              name: item.name,
              purchased,
              used,
              remaining: purchased - used,
              value: (purchased - used) * parseFloat(item.unitCost || 0)
            }
          }).sort((a: any, b: any) => b.value - a.value)
        },
        meals: {
          regularStudents: {
            total: mandoMeals.total,
            cost: mandoMeals.total * 50, // Assuming ₹50 per meal
            averagePerDay: mandoMeals.total / new Date(year, month, 0).getDate()
          },
          mandoStudents: {
            total: mandoMeals.total,
            cost: mandoMeals.total * 50,
            byGender: mandoMeals.byGender
          },
          outsiders: {
            total: outsiderMeals.total,
            cost: outsiderMeals.total * 50,
            memberCount: outsiderMeals.memberCount
          }
        },
        attendance: {
          averageAttendance: attendanceRate,
          totalPresent,
          totalAbsent,
          attendanceRate
        },
        alerts
      }

      // Calculate income and profit
      try {
        const feeRecordsRes = await fetch('/api/fee-records')
        if (feeRecordsRes.ok) {
          const feeRecords = await feeRecordsRes.json()
          const totalIncome = feeRecords.reduce((sum: number, record: any) => sum + parseFloat(record.amountPaid || 0), 0)
          dashboardData.kpis.totalIncome = totalIncome
          dashboardData.kpis.netProfit = totalIncome - dashboardData.kpis.totalExpenses
          dashboardData.kpis.profitMargin = totalIncome > 0 ? (dashboardData.kpis.netProfit / totalIncome) * 100 : 0
        }
      } catch (error) {
        console.error("Error fetching fee records:", error)
      }

      setDashboardData(dashboardData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-slate-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview for {dashboardData.currentMonth.monthName} {dashboardData.currentMonth.year}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Day {dashboardData.currentMonth.currentDay} of {dashboardData.currentMonth.daysInMonth}
            </span>
            <Progress
              value={(dashboardData.currentMonth.currentDay / dashboardData.currentMonth.daysInMonth) * 100}
              className="w-24 h-2"
            />
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
              alert.type === 'info' ? 'border-l-blue-500 bg-blue-50' :
              'border-l-green-500 bg-green-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                  {alert.type === 'info' && <Clock className="h-5 w-5 text-blue-600 mt-0.5" />}
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                  <div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboardData.kpis.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From student fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboardData.kpis.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Provisions + other costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {dashboardData.kpis.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardData.kpis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{Math.abs(dashboardData.kpis.netProfit).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.kpis.profitMargin >= 0 ? '+' : ''}{dashboardData.kpis.profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              of {dashboardData.kpis.totalStudents} total students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.expenses.byCategory.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{category.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ₹{category.amount.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {category.percentage.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.expenses.recent.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{expense.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Meals Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Meals Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.meals.regularStudents.total}
                  </div>
                  <div className="text-sm text-blue-600">Regular Student Meals</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ₹{dashboardData.meals.regularStudents.cost.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.meals.outsiders.total}
                  </div>
                  <div className="text-sm text-green-600">Outsider Meals</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dashboardData.meals.outsiders.memberCount} members
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Meals Served</span>
                  <span className="text-lg font-bold">{dashboardData.kpis.totalMeals}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Average per day</span>
                  <span className="text-sm font-medium">
                    {Math.round(dashboardData.kpis.totalMeals / dashboardData.currentMonth.daysInMonth)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle>Top Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.provisions.topItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.remaining.toFixed(1)} units
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{item.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Inventory Value</span>
                <span className="text-lg font-bold">₹{dashboardData.kpis.inventoryValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {dashboardData.attendance.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Attendance Rate</div>
              <Progress value={dashboardData.attendance.attendanceRate} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {dashboardData.attendance.totalPresent}
              </div>
              <div className="text-sm text-muted-foreground">Total Present</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {dashboardData.attendance.totalAbsent}
              </div>
              <div className="text-sm text-muted-foreground">Total Absent</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Package, Users, UserCheck, Eye, DollarSign, TrendingUp, Pencil, Plus, X, Save, FileText, Calendar } from "lucide-react"
import { computeMandays, AttendanceCode } from "@/lib/calculations"
import { toast } from "sonner"
import { YearPicker } from "@/components/ui/year-picker"

interface Semester {
  id: number
  name: string
  startDate: string
  endDate: string
  feeStructures: Array<{
    baseAmount: number
    finalAmount: number
  }>
}

interface ReportData {
  provisions: {
    totalCost: number
    purchases: Array<{
      id: string
      date: string
      vendor: string
      totalAmount: number
    }>
    usage: {
      totalQuantity: number
      totalCost: number
      items: Array<{
        id: string
        name: string
        quantity: number
        unitCost: number
        totalCost: number
      }>
    }
    inventory: {
      totalItems: number
      totalValue: number
      items: Array<{
        id: string
        name: string
        unit: string
        unitCost: number
        unitMeasure: string
        purchased: number
        used: number
        remaining: number
      }>
    }
  }
  incomes: {
    totalAdvancePaid: number
    bankInterestIncome: number
    externalIncomes: Array<{ id: string, name: string, amount: number }>
    totalExternalIncome: number
    totalIncome: number
    semesterName: string
    studentCount: number
  }
  expenses: {
    totalAmount: number
    count: number
    byType: {
      [type: string]: {
        amount: number
        count: number
      }
    }
    items: Array<{
      id: string
      name: string
      type: string
      amount: number
      date: string
      description: string
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
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const [outsiderRate, setOutsiderRate] = useState(50)
  const [mandoRate, setMandoRate] = useState(50)
  const [editingOutsiderRate, setEditingOutsiderRate] = useState(false)
  const [editingMandoRate, setEditingMandoRate] = useState(false)

  // Incomes states
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("")
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)
  const [loadingSemesters, setLoadingSemesters] = useState(false)
  const [bankInterestRate, setBankInterestRate] = useState<number>(2.50)
  const [editingInterestRate, setEditingInterestRate] = useState(false)
  const [externalIncomes, setExternalIncomes] = useState<Array<{ id: string, name: string, amount: number }>>([])
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [newIncomeName, setNewIncomeName] = useState('')
  const [newIncomeAmount, setNewIncomeAmount] = useState('')
  const [monthlyLabourCharge, setMonthlyLabourCharge] = useState<number | null>(null)
  const [perStudentCosts, setPerStudentCosts] = useState<{
    labourPerStudent: number
    provisionPerStudent: number
    totalPerStudent: number
    totalStudents: number
    totalLabourMandays: number
    totalProvisionMandays: number
    labourMandaysBoys: number
    labourMandaysGirls: number
    provisionMandaysBoys: number
    provisionMandaysGirls: number
  } | null>(null)
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [reportName, setReportName] = useState('')
  const [savingReport, setSavingReport] = useState(false)
  const [loadingSavedReports, setLoadingSavedReports] = useState(false)
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const [existingReport, setExistingReport] = useState<any>(null)
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new')
  const [loadedReport, setLoadedReport] = useState<any>(null)
  const [autoLoadingReport, setAutoLoadingReport] = useState(false)


  // Fetch semesters
  const fetchSemesters = async () => {
    setLoadingSemesters(true)
    try {
      const response = await fetch('/api/semesters')
      if (response.ok) {
        const data = await response.json()
        setSemesters(data)

        // Auto-select semester based on selected month
        if (data.length > 0 && !selectedSemesterId) {
          const matchingSemester = findSemesterForMonth(data, selectedYear, selectedMonth)
          if (matchingSemester) {
            setSelectedSemesterId(matchingSemester.id.toString())
            setSelectedSemester(matchingSemester)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching semesters:", error)
    } finally {
      setLoadingSemesters(false)
    }
  }

  // Find semester that contains the selected month
  const findSemesterForMonth = (semesters: Semester[], year: string, month: string): Semester | null => {
    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 15) // Middle of the month

    for (const semester of semesters) {
      const startDate = new Date(semester.startDate)
      const endDate = new Date(semester.endDate)

      if (selectedDate >= startDate && selectedDate <= endDate) {
        return semester
      }
    }

    return null
  }

  // Handle semester selection
  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId)
    if (semesterId === "auto-select") {
      const matchingSemester = findSemesterForMonth(semesters, selectedYear, selectedMonth)
      if (matchingSemester) {
        setSelectedSemester(matchingSemester)
      } else {
        setSelectedSemester(null)
      }
    } else {
      const semester = semesters.find(s => s.id.toString() === semesterId)
      setSelectedSemester(semester || null)
    }
  }

  const fetchReportData = async () => {
    console.log('fetchReportData called with local rates - Outsider:', outsiderRate, 'Mando:', mandoRate)
    setLoading(true)
    try {
      const params = new URLSearchParams({ year: selectedYear, month: selectedMonth })

      // Fetch all data in parallel
      // We need specific monthly data for report metrics, but ALL-TIME data for accurate Inventory Stock calculation
      const startDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)
      const endDateStr = endDate.toISOString().split('T')[0]

      const [provisionsRes, provisionUsageRes, provisionItemsRes, expensesRes, outsidersRes, mandoRes, allPurchasesRes, allUsageRes] = await Promise.all([
        fetch(`/api/provision-purchases?${params}`), // Monthly purchases
        fetch(`/api/provision-usage?startDate=${startDate}&endDate=${endDateStr}`), // Monthly usage
        fetch('/api/provisions'),
        fetch(`/api/expenses?${params}`),
        fetch(`/api/outsider-meal-records?${params}`),
        fetch(`/api/mando-meal-records?${params}`),
        fetch('/api/provision-purchases'), // All-time purchases for inventory
        fetch('/api/provision-usage')      // All-time usage for inventory
      ])

      const [provisionsData, provisionUsageData, provisionItemsData, expensesData, outsidersData, mandoData, allPurchasesData, allUsageData] = await Promise.all([
        provisionsRes.json(),
        provisionUsageRes.json(),
        provisionItemsRes.json(),
        expensesRes.json(),
        outsidersRes.json(),
        mandoRes.json(),
        allPurchasesRes.json(),
        allUsageRes.json()
      ])

      console.log('Fetched data - outsidersData length:', outsidersData.length, 'mandoData length:', mandoData.length)

      // Calculate provision purchases total (Monthly)
      const provisionsTotal = provisionsData.reduce((sum: number, item: any) => sum + parseFloat(item.totalAmount || 0), 0)

      // Calculate provision usage totals (Monthly)
      const provisionUsageTotal = provisionUsageData.reduce((acc: any, usage: any) => {
        const quantity = parseFloat(usage.quantity || 0)
        const unitCost = parseFloat(usage.provisionItem?.unitCost || 0)
        const totalCost = quantity * unitCost

        return {
          totalQuantity: acc.totalQuantity + quantity,
          totalCost: acc.totalCost + totalCost,
          items: [...acc.items, {
            id: usage.provisionItem?.id || '',
            name: usage.provisionItem?.name || 'Unknown',
            quantity,
            unitCost,
            totalCost
          }]
        }
      }, { totalQuantity: 0, totalCost: 0, items: [] })

      // Calculate inventory stock balance using ALL-TIME data (Cumulative)
      // This mimics logic from provisions/page.tsx
      const inventoryStock = provisionItemsData.map((item: any) => {
        // Find TOTAL purchased for this item (All time)
        const totalPurchased = allPurchasesData.reduce((sum: number, purchase: any) => {
          const itemPurchases = purchase.items?.filter((purchaseItem: any) => purchaseItem.provisionItem?.id === item.id) || []
          return sum + itemPurchases.reduce((itemSum: number, purchaseItem: any) => itemSum + parseFloat(purchaseItem.quantity || 0), 0)
        }, 0)

        // Find TOTAL used for this item (All time)
        const totalUsed = allUsageData.reduce((sum: number, usage: any) => {
          const usageItemId = usage.provisionItemId || usage.provisionItem?.id
          return usageItemId === item.id ? sum + parseFloat(usage.quantity || 0) : sum
        }, 0)

        const remainingQuantity = totalPurchased - totalUsed

        // Calculate average cost from purchase history for accurate valuation
        let averageCost = parseFloat(item.unitCost || 0)
        const itemPurchasesList = allPurchasesData.flatMap((p: any) => p.items || []).filter((i: any) => i.provisionItem?.id === item.id)
        if (itemPurchasesList.length > 0) {
          const totalCost = itemPurchasesList.reduce((sum: number, i: any) => sum + (parseFloat(i.quantity) * parseFloat(i.unitCost)), 0)
          const totalQty = itemPurchasesList.reduce((sum: number, i: any) => sum + parseFloat(i.quantity), 0)
          if (totalQty > 0) {
            averageCost = totalCost / totalQty
          }
        }

        return {
          id: item.id,
          name: item.name,
          unit: item.unit,
          unitCost: averageCost,
          unitMeasure: item.unitMeasure,
          purchased: totalPurchased,
          used: totalUsed,
          remaining: remainingQuantity
        }
      }).filter((item: any) => item.remaining > 0.01) // Only show items with valid remaining stock (tolerance for float errors)

      const inventoryTotal = {
        totalItems: inventoryStock.length,
        totalValue: inventoryStock.reduce((sum: number, item: any) => sum + (item.remaining * item.unitCost), 0),
        items: inventoryStock
      }

      const outsidersMeals = outsidersData.reduce((sum: number, record: any) =>
        sum + (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0), 0)

      console.log('Calculated outsidersMeals:', outsidersMeals, 'using outsiderRate:', outsiderRate)

      // Calculate mando meals by gender (boys/girls)
      const mandoMealsByGender = mandoData.reduce((acc: any, record: any) => {
        const gender = record.student?.gender
        const genderName = gender === 'M' ? 'Boys' : gender === 'G' ? 'Girls' : 'Unknown'
        const meals = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)

        if (!acc[genderName]) {
          acc[genderName] = { meals: 0, cost: 0 }
        }
        acc[genderName].meals += meals
        acc[genderName].cost += meals * mandoRate

        return acc
      }, {})

      const totalMandoMeals = Object.values(mandoMealsByGender).reduce((sum: number, gender: any) => sum + gender.meals, 0)
      const totalMandoCost = Object.values(mandoMealsByGender).reduce((sum: number, gender: any) => sum + gender.cost, 0)

      // Calculate expenses totals
      const expensesTotal = expensesData.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0)
      const expensesByType = expensesData.reduce((acc: any, expense: any) => {
        const type = expense.type
        if (!acc[type]) {
          acc[type] = { amount: 0, count: 0 }
        }
        acc[type].amount += parseFloat(expense.amount || 0)
        acc[type].count += 1
        return acc
      }, {})

      // Calculate incomes (advance paid for selected semester)
      const totalExternalIncome = externalIncomes.reduce((sum, income) => sum + income.amount, 0)

      let incomesData = {
        totalAdvancePaid: 0,
        bankInterestIncome: 0,
        externalIncomes,
        totalExternalIncome,
        totalIncome: totalExternalIncome,
        semesterName: selectedSemester?.name || 'No semester selected',
        studentCount: 0
      }

      if (selectedSemester) {
        try {
          const feeRecordsResponse = await fetch(`/api/fee-records?semesterId=${selectedSemester.id}`)
          if (feeRecordsResponse.ok) {
            const feeRecords = await feeRecordsResponse.json()
            const totalAdvancePaid = feeRecords.reduce((sum: number, record: any) => sum + parseFloat(record.amountPaid || 0), 0)

            // Calculate bank interest income using configurable rate
            const bankInterestIncome = totalAdvancePaid * (bankInterestRate / 100)

            incomesData = {
              totalAdvancePaid,
              bankInterestIncome,
              externalIncomes,
              totalExternalIncome,
              totalIncome: totalAdvancePaid + bankInterestIncome + totalExternalIncome,
              semesterName: selectedSemester.name,
              studentCount: feeRecords.length
            }
          }
        } catch (error) {
          console.error("Error fetching fee records for incomes:", error)
        }
      }

      console.log('Calculated mandoMealsByGender:', mandoMealsByGender, 'using mandoRate:', mandoRate)
      console.log('Total mando cost:', totalMandoCost, 'total mando meals:', totalMandoMeals)

      setReportData({
        provisions: {
          totalCost: provisionsTotal,
          purchases: provisionsData,
          usage: provisionUsageTotal,
          inventory: inventoryTotal
        },
        incomes: incomesData,
        expenses: {
          totalAmount: expensesTotal,
          count: expensesData.length,
          byType: expensesByType,
          items: expensesData.map((expense: any) => ({
            id: expense.id,
            name: expense.name,
            type: expense.type,
            amount: parseFloat(expense.amount || 0),
            date: expense.date,
            description: expense.description || ''
          }))
        },
        outsiders: {
          totalMeals: outsidersMeals,
          totalCost: outsidersMeals * outsiderRate,
          mealRate: outsiderRate,
          records: outsidersData
        },
        mando: {
          totalMeals: totalMandoMeals,
          totalCost: totalMandoCost,
          mealRate: mandoRate,
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
    fetchSemesters()
  }, [])

  useEffect(() => {
    // Update semester selection when month/year changes
    if (semesters.length > 0) {
      const matchingSemester = findSemesterForMonth(semesters, selectedYear, selectedMonth)
      if (matchingSemester) {
        setSelectedSemesterId(matchingSemester.id.toString())
        setSelectedSemester(matchingSemester)
      } else {
        setSelectedSemesterId("")
        setSelectedSemester(null)
      }
    }
  }, [selectedYear, selectedMonth, semesters])

  useEffect(() => {
    console.log('useEffect triggered with selectedYear:', selectedYear, 'selectedMonth:', selectedMonth)
    fetchReportData()
    // Note: outsiderRate and mandoRate are intentionally excluded to prevent refetch on rate changes
    // The rates are applied locally when displaying the data
  }, [selectedYear, selectedMonth, selectedSemester, externalIncomes])

  // Auto-load saved reports when semesters are loaded
  useEffect(() => {
    if (semesters.length > 0) {
      loadSavedReports()
    }
  }, [semesters])

  // Auto-load current month report when month/year changes
  useEffect(() => {
    if (semesters.length > 0 && !autoLoadingReport) {
      // Small delay to ensure all data is loaded
      const timeoutId = setTimeout(() => {
        autoLoadCurrentMonthReport()
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [selectedYear, selectedMonth, semesters])

  // Clear loaded report if it doesn't match current month/year
  useEffect(() => {
    if (loadedReport) {
      const reportMonth = loadedReport.month
      const reportYear = loadedReport.year
      const currentMonth = parseInt(selectedMonth)
      const currentYear = parseInt(selectedYear)

      if (reportMonth !== currentMonth || reportYear !== currentYear) {
        setLoadedReport(null)
      }
    }
  }, [selectedMonth, selectedYear, loadedReport])

  // Calculate per student costs when report data changes
  useEffect(() => {
    const calculatePerStudentCosts = async () => {
      if (reportData) {
        const costs = await getPerStudentPerDayCosts()
        setPerStudentCosts(costs)
      }
    }
    calculatePerStudentCosts()
  }, [reportData, monthlyLabourCharge, selectedYear, selectedMonth])


  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleRefresh = () => {
    window.location.reload()
  }

  const addExternalIncome = () => {
    if (!newIncomeName.trim() || !newIncomeAmount.trim()) {
      toast.error("Please enter both name and amount")
      return
    }

    const amount = parseFloat(newIncomeAmount)
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const newIncome = {
      id: Date.now().toString(),
      name: newIncomeName.trim(),
      amount: amount
    }

    setExternalIncomes(prev => [...prev, newIncome])
    setNewIncomeName('')
    setNewIncomeAmount('')
    setShowAddIncome(false)
    toast.success("External income added successfully")
  }

  const removeExternalIncome = (id: string) => {
    setExternalIncomes(prev => prev.filter(income => income.id !== id))
    toast.success("External income removed")
  }

  const getDaysInMonth = (year: string, month: string): number => {
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    return new Date(yearNum, monthNum, 0).getDate()
  }

  const getPerDayLabourCharge = (): number => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
    return daysInMonth > 0 && monthlyLabourCharge !== null ? monthlyLabourCharge / daysInMonth : 0
  }

  const getPerDayProvisionUsage = (): number => {
    if (!reportData) return 0
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
    const netProvisionCost = Math.max(0, reportData.provisions.usage.totalCost - reportData.mando.totalCost)
    return daysInMonth > 0 ? netProvisionCost / daysInMonth : 0
  }

  const [totalStudents, setTotalStudents] = useState<number>(0)

  const getTotalStudents = async (): Promise<number> => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const students = await response.json()
        // Only count regular students (not mando)
        const regularStudents = Array.isArray(students) ? students.filter((s: any) => !s.isMando) : []
        const count = regularStudents.length
        setTotalStudents(count)
        return count
      }
    } catch (error) {
      console.error("Error fetching student count:", error)
    }
    return totalStudents // Return cached value if API fails
  }

  const getPerStudentPerDayCosts = async () => {
    const totalStudents = await getTotalStudents()
    const labourPerDay = getPerDayLabourCharge()
    const provisionPerDay = getPerDayProvisionUsage()

    // Calculate separate labour and provision mandays using billing page logic
    let totalLabourMandays = 0
    let totalProvisionMandays = 0
    let labourMandaysBoys = 0
    let labourMandaysGirls = 0
    let provisionMandaysBoys = 0
    let provisionMandaysGirls = 0

    try {
      const startDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)
      const endDateStr = endDate.toISOString().split('T')[0]

      // Get all students
      const studentsResponse = await fetch('/api/students')
      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students")
      }
      const students = await studentsResponse.json()

      // Get all attendance records for the month
      const attendanceResponse = await fetch(`/api/attendance?startDate=${startDate}&endDate=${endDateStr}`)
      if (!attendanceResponse.ok) {
        throw new Error("Failed to fetch attendance")
      }
      const allAttendance = await attendanceResponse.json()

      // Calculate mandays for each student and sum them up
      for (const student of students) {
        const studentAttendance = allAttendance.filter((att: any) =>
          att.studentId === student.id &&
          new Date(att.date) >= new Date(startDate) &&
          new Date(att.date) <= new Date(endDateStr)
        )

        // Convert attendance records to proper format
        const attendanceRecords = studentAttendance.map((att: any) => ({
          code: att.code as AttendanceCode,
          date: new Date(att.date),
        }))

        // Calculate labour mandays (P + L + CN) - same as billing page
        const studentLabourMandays = attendanceRecords.filter((att: { code: AttendanceCode; date: Date }) =>
          att.code === AttendanceCode.P ||
          att.code === AttendanceCode.L ||
          att.code === AttendanceCode.CN
        ).length

        // Calculate provision mandays (P + L) - same as billing page
        const studentProvisionMandays = attendanceRecords.filter((att: { code: AttendanceCode; date: Date }) =>
          att.code === AttendanceCode.P ||
          att.code === AttendanceCode.L
        ).length

        totalLabourMandays += studentLabourMandays
        totalProvisionMandays += studentProvisionMandays

        // @ts-ignore
        const gender = student.gender || 'M'; // Default to M if missing, or handle appropriately
        if (gender === 'M') {
          labourMandaysBoys += studentLabourMandays
          provisionMandaysBoys += studentProvisionMandays
        } else if (gender === 'G') {
          labourMandaysGirls += studentLabourMandays
          provisionMandaysGirls += studentProvisionMandays
        }
      }
    } catch (error) {
      console.error("Error calculating mandays:", error)
      totalLabourMandays = 0
      totalProvisionMandays = 0
      labourMandaysBoys = 0
      labourMandaysGirls = 0
      provisionMandaysBoys = 0
      provisionMandaysGirls = 0
    }

    return {
      labourPerStudent: totalStudents > 0 ? labourPerDay / totalStudents : 0,
      provisionPerStudent: totalStudents > 0 ? provisionPerDay / totalStudents : 0,
      totalPerStudent: totalStudents > 0 ? (labourPerDay + provisionPerDay) / totalStudents : 0,
      totalStudents,
      totalLabourMandays,
      totalProvisionMandays,
      labourMandaysBoys,
      labourMandaysGirls,
      provisionMandaysBoys,
      provisionMandaysGirls,
    }
  }

  const checkExistingReport = async () => {
    try {
      const response = await fetch('/api/saved-reports')
      if (response.ok) {
        const reports = await response.json()
        // Find report for current month/year
        const existing = reports.find((report: any) =>
          report.month === parseInt(selectedMonth) && report.year === parseInt(selectedYear)
        )
        return existing
      }
    } catch (error) {
      console.error('Error checking existing reports:', error)
    }
    return null
  }

  const handleSaveClick = async () => {
    if (!reportData) {
      toast.error("No report data to save")
      return
    }

    // Check if report already exists for this month/year
    const existing = await checkExistingReport()
    if (existing) {
      setExistingReport(existing)
      setShowOverwriteDialog(true)
      return
    }

    // No existing report, show normal save dialog
    setShowSaveDialog(true)
  }

  const saveReport = async (mode: 'new' | 'overwrite' = 'new') => {
    if (!reportName.trim() && mode === 'new') {
      toast.error("Please enter a report name")
      return
    }

    if (!reportData) {
      toast.error("No report data to save")
      return
    }

    setSavingReport(true)
    try {
      const totalExpenses = (reportData.expenses?.totalAmount || 0) +
        (reportData.provisions?.usage?.totalCost || 0) +
        (reportData.mando?.totalCost || 0) +
        (monthlyLabourCharge || 0)

      const totalIncomes = (reportData.incomes?.totalAdvancePaid || 0) +
        (reportData.incomes?.bankInterestIncome || 0) +
        (reportData.incomes?.totalExternalIncome || 0)

      const netProfit = totalIncomes - totalExpenses

      // Save only user-configured settings and calculated summary
      const settings = {
        labourCharge: monthlyLabourCharge,
        outsiderRate,
        mandoRate,
        bankInterestRate,
        externalIncomes,
        selectedSemesterId,
        selectedSemester,
        // Include the new mandays breakdown in saved settings
        mandaysBreakdown: perStudentCosts ? {
          totalLabourMandays: perStudentCosts.totalLabourMandays,
          totalProvisionMandays: perStudentCosts.totalProvisionMandays,
          totalStudents: perStudentCosts.totalStudents,
        } : null,
      }

      const summary = {
        totalExpenses,
        totalIncomes,
        netProfit,
      }

      const finalReportName = mode === 'overwrite' && existingReport
        ? existingReport.reportName
        : reportName.trim()

      let response

      if (mode === 'overwrite' && existingReport) {
        // Use PUT to update existing report
        response = await fetch(`/api/saved-reports/${existingReport.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportName: finalReportName,
            settings,
            summary,
          }),
        })
      } else {
        // Use POST to create new report
        response = await fetch('/api/saved-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
            reportName: finalReportName,
            settings,
            summary,
          }),
        })
      }

      if (response.ok) {
        const savedReport = await response.json()
        toast.success(mode === 'overwrite'
          ? "Report updated successfully!"
          : "Report saved successfully!"
        )
        setShowSaveDialog(false)
        setShowOverwriteDialog(false)
        setReportName('')
        setExistingReport(null)

        // Refresh saved reports and auto-load current month report
        const updatedReports = await loadSavedReports()
        await autoLoadCurrentMonthReport()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save report')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      toast.error("Failed to save report")
    } finally {
      setSavingReport(false)
    }
  }

  const loadSavedReports = async () => {
    setLoadingSavedReports(true)
    try {
      const response = await fetch('/api/saved-reports')
      if (response.ok) {
        const reports = await response.json()
        setSavedReports(reports)
        return reports
      }
    } catch (error) {
      console.error('Error loading saved reports:', error)
      toast.error("Failed to load saved reports")
    } finally {
      setLoadingSavedReports(false)
    }
    return []
  }

  const autoLoadCurrentMonthReport = async () => {
    if (autoLoadingReport) return // Prevent multiple simultaneous loads

    setAutoLoadingReport(true)
    try {
      const reports = await loadSavedReports()

      // Find report for current month/year
      const currentMonthReport = reports.find((report: any) =>
        report.month === parseInt(selectedMonth) && report.year === parseInt(selectedYear)
      )

      if (currentMonthReport) {
        // Load the current month's report automatically
        await loadReport(currentMonthReport.id)
        setLoadedReport(currentMonthReport)
      } else {
        setLoadedReport(null)
      }
    } catch (error) {
      console.error('Error auto-loading current month report:', error)
    } finally {
      setAutoLoadingReport(false)
    }
  }

  const loadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/saved-reports/${reportId}`)
      if (response.ok) {
        const report = await response.json()

        // Load the period settings
        setSelectedYear(report.year.toString())
        setSelectedMonth(report.month.toString())

        // Restore all user-configured settings
        if (report.settings?.labourCharge !== undefined) {
          setMonthlyLabourCharge(report.settings.labourCharge)
        }
        if (report.settings?.outsiderRate !== undefined) {
          setOutsiderRate(report.settings.outsiderRate)
        }
        if (report.settings?.mandoRate !== undefined) {
          setMandoRate(report.settings.mandoRate)
        }
        if (report.settings?.bankInterestRate !== undefined) {
          setBankInterestRate(report.settings.bankInterestRate)
        }
        if (report.settings?.externalIncomes) {
          setExternalIncomes(report.settings.externalIncomes)
        }
        if (report.settings?.selectedSemesterId) {
          setSelectedSemesterId(report.settings.selectedSemesterId)
          const matchingSemester = semesters.find(s => s.id.toString() === report.settings.selectedSemesterId)
          if (matchingSemester) {
            setSelectedSemester(matchingSemester)
          }
        }

        // Restore mandays breakdown if available (for backward compatibility)
        if (report.settings?.mandaysBreakdown) {
          setPerStudentCosts({
            labourPerStudent: 0, // Will be recalculated
            provisionPerStudent: 0, // Will be recalculated
            totalPerStudent: 0, // Will be recalculated
            totalStudents: report.settings.mandaysBreakdown.totalStudents,
            totalLabourMandays: report.settings.mandaysBreakdown.totalLabourMandays,
            totalProvisionMandays: report.settings.mandaysBreakdown.totalProvisionMandays,
            labourMandaysBoys: report.settings.mandaysBreakdown.labourMandaysBoys || 0,
            labourMandaysGirls: report.settings.mandaysBreakdown.labourMandaysGirls || 0,
            provisionMandaysBoys: report.settings.mandaysBreakdown.provisionMandaysBoys || 0,
            provisionMandaysGirls: report.settings.mandaysBreakdown.provisionMandaysGirls || 0,
          })
        }

        // Set the loaded report for display
        setLoadedReport(report)

        // Trigger fresh data fetch with the restored settings
        // fetchReportData() will be called by the useEffect when states change

        toast.success(`Report "${report.reportName}" loaded successfully!`)
      } else {
        throw new Error('Failed to load report')
      }
    } catch (error) {
      console.error('Error loading report:', error)
      toast.error("Failed to load report")
    }
  }

  const deleteReport = async (reportId: string, reportName: string) => {
    if (!confirm(`Are you sure you want to delete the report "${reportName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/saved-reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Report deleted successfully!")
        loadSavedReports()
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error("Failed to delete report")
    }
  }

  const exportToCSV = () => {
    if (!reportData) {
      toast.error("No report data to export")
      return
    }

    const filename = `mess-account-statement-${selectedYear}-${selectedMonth}.csv`
    const monthName = monthNames[parseInt(selectedMonth) - 1]
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)

    // CSV Header
    const csvData = [
      ["UNIVERSITY COLLEGE OF ENGINEERING KANCHEEPURAM"],
      ["Ponnerikarai, Kanchipuram - 631 552."],
      ["STUDENTS DIVIDING MESS"],
      [`ACCOUNT STATEMENT FOR THE MONTH OF ${monthName.toUpperCase()} ${selectedYear} (${daysInMonth} Days)`],
      [""],
      ["1. CREDITS"],
      ["Description", "Amount"],
      ["Advance Paid", parseFloat(String(reportData.incomes.totalAdvancePaid)).toFixed(2)],
      ["Bank Interest Income", parseFloat(String(reportData.incomes.bankInterestIncome)).toFixed(2)],
      ["Total External Income", parseFloat(String(reportData.incomes.totalExternalIncome)).toFixed(2)],
      ["Total Credits", parseFloat(String(reportData.incomes.totalIncome)).toFixed(2)],
      [""],
      ["2. DEBITS"],
      ["Description", "Amount"],
      ["Provisions Purchased", parseFloat(String(reportData.provisions.totalCost)).toFixed(2)],
      ["Provision Usage", parseFloat(String(reportData.provisions.usage.totalCost)).toFixed(2)],
      ["Labour Charges", parseFloat(String(monthlyLabourCharge || 0)).toFixed(2)],
      ["Outsiders Meals", parseFloat(String(reportData.outsiders.totalCost)).toFixed(2)],
      ["Mando Students Meals", parseFloat(String(reportData.mando.totalCost)).toFixed(2)],
      ["Other Expenses", parseFloat(String(reportData.expenses.totalAmount)).toFixed(2)],
      ["Total Debits", parseFloat(String(reportData.expenses.totalAmount + reportData.provisions.usage.totalCost + (monthlyLabourCharge || 0) + reportData.outsiders.totalCost + reportData.mando.totalCost)).toFixed(2)],
      [""],
      ["3. PER DAY CHARGES"],
      ["Description", "Rate"],
      ["Labour Charge per Day", parseFloat(String(getPerDayLabourCharge())).toFixed(2)],
      ["Provision Usage per Day", parseFloat(String(getPerDayProvisionUsage())).toFixed(2)],
      ["Outsider Meal Rate", parseFloat(String(outsiderRate)).toFixed(2)],
      ["Mando Meal Rate", parseFloat(String(mandoRate)).toFixed(2)],
      [""],
      ["4. MANDAYS BREAKDOWN"],
      ["Mandays Type", "Count", "Description"],
      ["Labour Mandays (P + L + CN)", perStudentCosts?.totalLabourMandays?.toString() || "0", "Present + Leave + Casual Leave"],
      ["Provision Mandays (P + L)", perStudentCosts?.totalProvisionMandays?.toString() || "0", "Present + Leave only"],
      [""],
      ["5. MONTHLY BREAKDOWN"],
      ["Cost Type", "Total Amount", "Per Student Per Day"],
      ["Total Labour Cost", ((perStudentCosts?.labourPerStudent || 0) * (perStudentCosts?.totalStudents || 0) * getDaysInMonth(selectedYear, selectedMonth)).toFixed(2), (perStudentCosts?.labourPerStudent || 0).toFixed(2)],
      ["Total Provision Cost", ((perStudentCosts?.provisionPerStudent || 0) * (perStudentCosts?.totalStudents || 0) * getDaysInMonth(selectedYear, selectedMonth)).toFixed(2), (perStudentCosts?.provisionPerStudent || 0).toFixed(2)],
    ]

    // Add expenses details if any
    if (reportData.expenses.items.length > 0) {
      csvData.push([""])
      csvData.push(["EXPENSES DETAILS"])
      csvData.push(["Description", "Amount"])
      reportData.expenses.items.forEach((expense: any) => {
        csvData.push([`${expense.name} (${expense.type})`, parseFloat(String(expense.amount)).toFixed(2)])
      })
    }

    // Add external income sources if any
    if (reportData.incomes.externalIncomes.length > 0) {
      csvData.push([""])
      csvData.push(["OTHER EXTERNAL INCOME SOURCES"])
      csvData.push(["Description", "Amount"])
      reportData.incomes.externalIncomes.forEach((income: any) => {
        csvData.push([income.name, parseFloat(String(income.amount)).toFixed(2)])
      })
    }

    // Convert to CSV
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("CSV exported successfully!")
  }


  return (
    <div className="w-full max-w-full space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Monthly Reports</h1>
          <p className="text-muted-foreground mt-1">Independent cost reports for each category</p>
          {loadedReport && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in fade-in slide-in-from-top-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Loaded: {loadedReport.reportName}
                </span>
                <button
                  onClick={() => setLoadedReport(null)}
                  className="ml-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                  title="Clear loaded report"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleSaveClick} className="border-border shadow-sm">
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="border-border shadow-sm">
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="border-border shadow-sm">
            Refresh
          </Button>
          <YearPicker
            value={selectedYear}
            onValueChange={setSelectedYear}
            className="w-32 bg-background border-input"
          />
          <div className="flex items-center space-x-2">
            <Label className="text-muted-foreground">Month:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 bg-background border-input">
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

          {/* Inventory Details Dialog */}
          <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
            <DialogContent className="max-w-4xl bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Inventory Stock Balance - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Items with remaining stock after accounting for usage in the selected month.
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Item Name</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Purchased</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Used</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Remaining</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Unit Cost</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {reportData?.provisions.inventory.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-medium text-foreground">{item.name}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-muted-foreground">{item.purchased.toFixed(2)} {item.unit}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-muted-foreground">{item.used.toFixed(2)} {item.unit}</td>
                          <td className="px-4 py-2.5 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">{item.remaining.toFixed(2)} {item.unit}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-muted-foreground">₹{item.unitCost.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-foreground">₹{(item.remaining * item.unitCost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t border-border">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">Total</td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-muted-foreground">
                          {reportData?.provisions.inventory.items.reduce((sum: number, item: any) => sum + item.remaining, 0).toFixed(2)} units
                        </td>
                        <td className="px-4 py-3 text-sm text-right">-</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                          ₹{reportData?.provisions.inventory.totalValue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setInventoryDialogOpen(false)} className="border-border">
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 border border-dashed border-border rounded-xl bg-muted/5">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground font-medium">Loading report data...</span>
          </div>
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          {/* Provisions Report */}
          <Card className="col-span-1 md:col-span-12 border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Provisions Overview - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Provision Purchases */}
                <div className="p-5 border border-blue-200/50 dark:border-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 transition-colors hover:bg-blue-50/80 dark:hover:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Purchases</p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">Total spent on provisions</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-full">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-950 dark:text-blue-100">
                      ₹{reportData.provisions.totalCost.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Provision Usage */}
                {/* Provision Usage */}
                <div className="p-5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/10 transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Provision Usage</p>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Analysis & Deduction</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-full">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Gross Usage */}
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-emerald-800/80 dark:text-emerald-300/80">Gross Usage</span>
                      <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                        ₹{reportData.provisions.usage.totalCost.toLocaleString()}
                      </span>
                    </div>

                    {/* Deduction Line */}
                    <div className="flex justify-between items-center text-rose-600/90 dark:text-rose-400/90 px-2 py-1 bg-rose-50/50 dark:bg-rose-950/20 rounded border border-rose-100 dark:border-rose-900/30">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">(-) Mando Deduction</span>
                        <span className="text-[10px] opacity-80">({reportData.mando.totalMeals} meals)</span>
                      </div>
                      <span className="text-sm font-semibold">- ₹{reportData.mando.totalCost.toLocaleString()}</span>
                    </div>

                    {/* Net Usage */}
                    <div className="pt-2 border-t-2 border-emerald-200 dark:border-emerald-800 border-dashed">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Net Usage</span>
                        <span className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">
                          ₹{(Math.max(0, reportData.provisions.usage.totalCost - reportData.mando.totalCost)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Stock */}
                <div className="p-5 border border-purple-200/50 dark:border-purple-900/30 rounded-xl bg-purple-50/50 dark:bg-purple-950/10 transition-colors hover:bg-purple-50/80 dark:hover:bg-purple-950/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-300">Inventory</p>
                      <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-0.5">Stock balance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInventoryDialogOpen(true)}
                        className="h-7 px-2.5 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/30 text-xs border border-purple-200/50 dark:border-purple-800/30"
                      >
                        <Eye className="h-3 w-3 mr-1.5" />
                        View
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-950 dark:text-purple-100">
                      ₹{reportData.provisions.inventory.totalValue.toLocaleString()}
                    </div>
                    <p className="text-xs font-medium text-purple-600/90 dark:text-purple-400/90 mt-1">
                      {reportData.provisions.inventory.totalItems} items remaining
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Report */}
          <Card className="col-span-1 md:col-span-6 border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-orange-500/10 rounded-lg mr-3">
                  <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    ₹{reportData.expenses.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {reportData.expenses.count} expenses for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                  </div>
                </div>
                {Object.keys(reportData.expenses.byType).length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    {Object.entries(reportData.expenses.byType).map(([type, data]: [string, any]) => (
                      <div key={type} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-muted-foreground font-medium capitalize flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                          {type.toLowerCase()}
                        </span>
                        <span className="text-foreground font-medium">{data.count} items <span className="text-muted-foreground ml-1">(₹{data.amount.toLocaleString()})</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Labour Charges Report */}
          <Card className="col-span-1 md:col-span-6 border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                Labour Charges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Monthly Labour Charge Input */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Monthly Labour Charge</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={monthlyLabourCharge ?? ''}
                      onChange={(e) => setMonthlyLabourCharge(e.target.value ? parseFloat(e.target.value) : null)}
                      className="flex-1 h-11 text-lg font-semibold bg-background border-input focus:border-amber-500/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Per Day Calculation Display */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-semibold text-amber-900 dark:text-amber-400">
                        Per Day Labour Charge
                      </div>
                      <div className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1">
                        {getDaysInMonth(selectedYear, selectedMonth)} days in {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        ₹{getPerDayLabourCharge().toFixed(2)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600/70 dark:text-amber-500/70 mt-0.5">
                        per day
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Monthly Display */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Monthly Labour Cost
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ₹{monthlyLabourCharge?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incomes Report */}
          <Card className="col-span-1 md:col-span-12 border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Mess Income
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{reportData.incomes.totalAdvancePaid.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mt-1">
                      Total Advance Paid
                    </div>
                  </div>
                  <div className="space-y-2 w-full sm:w-auto">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semester Selection</Label>
                    {loadingSemesters ? (
                      <div className="flex items-center justify-center h-10 w-full sm:w-48 border border-input rounded-md bg-background px-3">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      </div>
                    ) : (
                      <Select value={selectedSemesterId} onValueChange={handleSemesterChange}>
                        <SelectTrigger className="w-full sm:w-56 h-10 bg-background">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto-select">Auto-select for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</SelectItem>
                          {semesters.map(semester => (
                            <SelectItem key={semester.id} value={semester.id.toString()}>
                              {semester.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-5 space-y-5">
                  <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          ₹{reportData.incomes.bankInterestIncome.toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-600/80 dark:text-blue-400/80 flex items-center mt-0.5">
                          Bank Interest Income (
                          {editingInterestRate ? (
                            <div className="flex items-center space-x-1 mx-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={bankInterestRate}
                                onChange={(e) => setBankInterestRate(parseFloat(e.target.value) || 0)}
                                className="w-16 h-6 text-xs px-1 bg-white dark:bg-black/20 border-blue-200"
                                onBlur={() => setEditingInterestRate(false)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingInterestRate(false)
                                  }
                                }}
                                autoFocus
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:bg-blue-500/10 px-1.5 py-0.5 rounded mx-1 flex items-center space-x-1 transition-colors border border-transparent hover:border-blue-200/50"
                              onClick={() => setEditingInterestRate(true)}
                            >
                              <span className="font-semibold">{bankInterestRate.toFixed(2)}%</span>
                              <Pencil className="h-3 w-3 text-blue-500 opacity-70" />
                            </span>
                          )}
                          )
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Monthly Interest
                      </div>
                      <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                        For {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                      </div>
                    </div>
                  </div>

                  {/* External Incomes List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        Other External Income Sources
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowAddIncome(true)}
                        className="h-8 px-3 text-xs bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-200/50"
                      >
                        <Plus className="h-3 w-3 mr-1.5" />
                        Add Income
                      </Button>
                    </div>

                    {reportData.incomes.externalIncomes.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.incomes.externalIncomes.map((income) => (
                          <div key={income.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">{income.name}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-semibold text-muted-foreground">
                                ₹{income.amount.toLocaleString()}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExternalIncome(income.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                          <div className="text-sm font-bold text-purple-900 dark:text-purple-300">Total External Income</div>
                          <div className="text-sm font-bold text-purple-700 dark:text-purple-400">
                            ₹{reportData.incomes.totalExternalIncome.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-border rounded-xl bg-muted/5">
                        <p className="text-sm text-muted-foreground">No external income sources added</p>
                      </div>
                    )}

                    {/* Add Income Dialog */}
                    {showAddIncome && (
                      <div className="p-4 bg-muted/50 rounded-xl border border-border mt-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-4">
                          <div className="text-sm font-medium text-foreground">Add New Income Source</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                              placeholder="Income name"
                              value={newIncomeName}
                              onChange={(e) => setNewIncomeName(e.target.value)}
                              className="h-9 text-sm bg-background"
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground font-medium">₹</span>
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={newIncomeAmount}
                                onChange={(e) => setNewIncomeAmount(e.target.value)}
                                className="h-9 text-sm bg-background"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addExternalIncome()
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 pt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowAddIncome(false)
                                setNewIncomeName('')
                                setNewIncomeAmount('')
                              }}
                              className="h-8 px-4 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={addExternalIncome}
                              className="h-8 px-4 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                            >
                              Add Income
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/50 pt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          ₹{reportData.incomes.totalIncome.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">
                          Total Income
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground bg-muted py-1 px-3 rounded-full">
                          Advance + Interest + External
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 opacity-70" />
                  <span>{reportData.incomes.studentCount} students paid advance for <span className="font-semibold text-foreground">{reportData.incomes.semesterName}</span></span>
                </div>
                {selectedSemester && (
                  <div className="text-xs text-muted-foreground/70 pl-6">
                    {new Date(selectedSemester.startDate).toLocaleDateString()} - {new Date(selectedSemester.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Outsiders Report */}
          <Card className="col-span-1 md:col-span-6 border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-green-500/10 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Outsiders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ₹{(reportData.outsiders.totalMeals * outsiderRate).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground flex items-center p-2 bg-muted/40 rounded-lg border border-border/40 w-fit">
                  <span className="font-semibold text-foreground mr-1">{reportData.outsiders.totalMeals}</span> meals × ₹
                  {editingOutsiderRate ? (
                    <div className="flex items-center space-x-1 ml-1">
                      <Input
                        type="number"
                        value={outsiderRate}
                        onChange={(e) => setOutsiderRate(parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-xs px-1 bg-background"
                        onBlur={() => setEditingOutsiderRate(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingOutsiderRate(false)
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:bg-muted/60 px-1.5 py-0.5 rounded ml-1 flex items-center space-x-1 border border-transparent hover:border-border transition-all"
                      onClick={() => setEditingOutsiderRate(true)}
                      title="Edit Rate"
                    >
                      <span className="font-medium text-foreground">{outsiderRate}</span>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-70" />
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mando Report */}
          <Card className="col-span-1 md:col-span-6 border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-orange-500/10 rounded-lg mr-3">
                  <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Mando Students
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  ₹{(reportData.mando.totalMeals * mandoRate).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground flex items-center p-2 bg-muted/40 rounded-lg border border-border/40 w-fit">
                  <span className="font-semibold text-foreground mr-1">{reportData.mando.totalMeals}</span> meals × ₹
                  {editingMandoRate ? (
                    <div className="flex items-center space-x-1 ml-1">
                      <Input
                        type="number"
                        value={mandoRate}
                        onChange={(e) => setMandoRate(parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-xs px-1 bg-background"
                        onBlur={() => setEditingMandoRate(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingMandoRate(false)
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:bg-muted/60 px-1.5 py-0.5 rounded ml-1 flex items-center space-x-1 border border-transparent hover:border-border transition-all"
                      onClick={() => setEditingMandoRate(true)}
                      title="Edit Rate"
                    >
                      <span className="font-medium text-foreground">{mandoRate}</span>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-70" />
                    </span>
                  )}
                </div>
                {reportData.mando.byGender && (
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    {Object.entries(reportData.mando.byGender).map(([genderName, data]: [string, any]) => (
                      <div key={genderName} className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${genderName === 'Boys' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                          {genderName}
                        </span>
                        <span className="text-foreground">{data.meals} meals <span className="text-muted-foreground text-xs ml-1">(₹{data.cost.toLocaleString()})</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Per Student Per Day Cost Analysis */}
          <Card className="col-span-1 md:col-span-12 border-border/60 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-semibold flex items-center text-foreground">
                <div className="p-2 bg-indigo-500/10 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Per Student Per Day Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {perStudentCosts ? (
                  <>
                    <div className="text-sm text-muted-foreground mb-4">
                      Based on <span className="font-bold text-foreground">{perStudentCosts.totalStudents}</span> students for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                    </div>

                    {/* Total Mandays Display */}
                    <div className="mb-6 p-5 bg-muted/40 border border-border/60 rounded-xl">
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-background border border-border rounded-md shadow-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-foreground">
                                Total Mandays Breakdown
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Separate calculations for labour and provision charges
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Labour Mandays */}
                          <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-foreground">Labour Mandays</div>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground whitespace-nowrap">P + L + CN</span>
                                </div>
                                <div className="mt-2 text-3xl font-bold text-foreground">
                                  {perStudentCosts.totalLabourMandays.toLocaleString()}
                                </div>
                              </div>
                              <div className="p-2 bg-blue-500/10 rounded-full mb-1">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                              <div className="flex flex-col items-center bg-blue-50/50 dark:bg-blue-900/10 rounded p-1.5 border border-blue-100 dark:border-blue-900/20">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Boys
                                </span>
                                <span className="text-base font-bold text-foreground">{perStudentCosts.labourMandaysBoys}</span>
                              </div>
                              <div className="flex flex-col items-center bg-pink-50/50 dark:bg-pink-900/10 rounded p-1.5 border border-pink-100 dark:border-pink-900/20">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Girls
                                </span>
                                <span className="text-base font-bold text-foreground">{perStudentCosts.labourMandaysGirls}</span>
                              </div>
                            </div>
                          </div>

                          {/* Provision Mandays */}
                          <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-foreground">Provision Mandays</div>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground whitespace-nowrap">P + L</span>
                                </div>
                                <div className="mt-2 text-3xl font-bold text-foreground">
                                  {perStudentCosts.totalProvisionMandays.toLocaleString()}
                                </div>
                              </div>
                              <div className="p-2 bg-emerald-500/10 rounded-full mb-1">
                                <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                              <div className="flex flex-col items-center bg-blue-50/50 dark:bg-blue-900/10 rounded p-1.5 border border-blue-100 dark:border-blue-900/20">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Boys
                                </span>
                                <span className="text-base font-bold text-foreground">{perStudentCosts.provisionMandaysBoys}</span>
                              </div>
                              <div className="flex flex-col items-center bg-pink-50/50 dark:bg-pink-900/10 rounded p-1.5 border border-pink-100 dark:border-pink-900/20">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Girls
                                </span>
                                <span className="text-base font-bold text-foreground">{perStudentCosts.provisionMandaysGirls}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Labour Charge Per Student */}
                      <div className="p-5 border border-amber-200/50 dark:border-amber-900/30 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50/80 dark:hover:bg-amber-950/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">Labour Cost</p>
                            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">per student / day</p>
                          </div>
                          <div className="p-1.5 bg-amber-500/10 rounded-md">
                            <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-2xl font-bold text-amber-950 dark:text-amber-100">
                            ₹{perStudentCosts.labourPerStudent.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Provision Usage Per Student */}
                      <div className="p-5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">Provision Cost</p>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">per student / day</p>
                          </div>
                          <div className="p-1.5 bg-emerald-500/10 rounded-md">
                            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">
                            ₹{perStudentCosts.provisionPerStudent.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Total Per Student & Monthly Cost */}
                      <div className="p-5 border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/20 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Per Day */}
                          <div className="border-r border-indigo-200/50 dark:border-indigo-800/30 pr-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-400">Total Cost</p>
                                <p className="text-xs text-indigo-600/80 dark:text-indigo-500/80 mt-0.5">per student / day</p>
                              </div>
                              <div className="p-1.5 bg-indigo-500/10 rounded-md">
                                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="text-3xl font-bold text-indigo-950 dark:text-indigo-100">
                                ₹{perStudentCosts.totalPerStudent.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Per Month */}
                          <div className="pl-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-400">Total Monthly Cost</p>
                                <p className="text-xs text-indigo-600/80 dark:text-indigo-500/80 mt-0.5">per student / month</p>
                              </div>
                              <div className="p-1.5 bg-indigo-500/10 rounded-md">
                                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="text-3xl font-bold text-indigo-950 dark:text-indigo-100">
                                ₹{(perStudentCosts.totalPerStudent * getDaysInMonth(selectedYear, selectedMonth)).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-5 bg-muted/40 border border-border/60 rounded-xl">
                      <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                        Monthly Breakdown
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-background p-3 rounded-lg border border-border shadow-sm flex justify-between items-center">
                          <span className="text-muted-foreground">Total Labour Cost</span>
                          <span className="font-bold text-foreground">₹{(perStudentCosts.labourPerStudent * perStudentCosts.totalStudents * getDaysInMonth(selectedYear, selectedMonth)).toLocaleString()}</span>
                        </div>
                        <div className="bg-background p-3 rounded-lg border border-border shadow-sm flex justify-between items-center">
                          <span className="text-muted-foreground">Total Provision Cost</span>
                          <span className="font-bold text-foreground">₹{(perStudentCosts.provisionPerStudent * perStudentCosts.totalStudents * getDaysInMonth(selectedYear, selectedMonth)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground font-medium">Calculating per student costs...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl bg-muted/5">
          <div className="text-4xl mb-4 opacity-20">📊</div>
          <p className="text-lg font-medium text-foreground">No data available</p>
          <p className="text-sm text-muted-foreground mt-1">Please select a different period or verify data exists for this month.</p>
        </div>
      )}

      {/* Saved Reports Section */}
      <Card className="mt-6 border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center text-foreground">
            <Eye className="h-5 w-5 mr-3 text-primary" />
            Saved Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={loadSavedReports}
              disabled={loadingSavedReports}
              className="w-full border-border"
            >
              {loadingSavedReports ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                  Loading...
                </>
              ) : (
                "Refresh Saved Reports"
              )}
            </Button>

            {savedReports.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {savedReports.length} saved report(s) found
                </div>
                {savedReports.map((report: any) => (
                  <div key={report.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-border/60 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="mb-3 sm:mb-0">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {report.reportName}
                        {report.id === loadedReport?.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">Active</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1">
                        <span className="font-medium text-foreground">{monthNames[report.month - 1]} {report.year}</span>
                        <span className="text-border">•</span>
                        <span>Exp: ₹{report.summary?.totalExpenses?.toLocaleString() || '0'}</span>
                        <span className="text-border">•</span>
                        <span>Inc: ₹{report.summary?.totalIncomes?.toLocaleString() || '0'}</span>
                        <span className="text-border">•</span>
                        <span className={report.summary?.netProfit >= 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                          Net: ₹{report.summary?.netProfit?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground/60 mt-2">
                        Saved on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant={report.id === loadedReport?.id ? "secondary" : "outline"}
                        onClick={() => loadReport(report.id)}
                        className="flex-1 sm:flex-none border-border"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReport(report.id, report.reportName)}
                        className="flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/5">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No saved reports found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Save your first report using the "Save Bill" button.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Report Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-border">
          <DialogHeader>
            <DialogTitle>Save Monthly Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder={`Report for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`}
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveReport('new')
                  }
                }}
                className="bg-background"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              This will save all current report data including expenses, incomes, and calculations for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}.
            </div>
          </div>
          <div className="flex justify-end gap-2 text-white">
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={() => saveReport('new')} disabled={savingReport} className="text-white">
              {savingReport ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overwrite Confirmation Dialog */}
      <Dialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <span className="bg-destructive/10 p-1.5 rounded-full"><div className="w-2 h-2 bg-destructive rounded-full"></div></span>
              Report Already Exists
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              A report for <strong>{monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</strong> already exists:
            </div>
            {existingReport && (
              <div className="p-4 bg-muted/40 border border-border/60 rounded-xl">
                <div className="font-semibold text-foreground">{existingReport.reportName}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Saved on {new Date(existingReport.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              What would you like to do?
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowOverwriteDialog(false)
                setExistingReport(null)
                // Auto-populate a unique name for the new report
                const baseName = `Report for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`
                const timestamp = new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
                setReportName(`${baseName} (${timestamp})`)
                setShowSaveDialog(true)
              }}
              className="sm:order-1"
            >
              Create New
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowOverwriteDialog(false)
                setExistingReport(null)
              }}
              className="sm:order-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveReport('overwrite')}
              disabled={savingReport}
              className="bg-destructive hover:bg-destructive/90 text-white sm:order-3"
            >
              {savingReport ? "Updating..." : "Overwrite Existing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

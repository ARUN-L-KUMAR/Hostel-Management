"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Package, Users, UserCheck, Eye, DollarSign, TrendingUp, Pencil, Plus, X, Save, FileText } from "lucide-react"
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
    externalIncomes: Array<{id: string, name: string, amount: number}>
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
  const [externalIncomes, setExternalIncomes] = useState<Array<{id: string, name: string, amount: number}>>([])
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [newIncomeName, setNewIncomeName] = useState('')
  const [newIncomeAmount, setNewIncomeAmount] = useState('')
  const [monthlyLabourCharge, setMonthlyLabourCharge] = useState<number | null>(null)
  const [perStudentCosts, setPerStudentCosts] = useState<{
    labourPerStudent: number
    provisionPerStudent: number
    totalPerStudent: number
    totalStudents: number
  } | null>(null)
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [reportName, setReportName] = useState('')
  const [savingReport, setSavingReport] = useState(false)
  const [loadingSavedReports, setLoadingSavedReports] = useState(false)


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

      // Calculate date range for provision usage
      const startDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)
      const endDateStr = endDate.toISOString().split('T')[0]

      // Fetch all data in parallel
      const [provisionsRes, provisionUsageRes, provisionItemsRes, expensesRes, outsidersRes, mandoRes] = await Promise.all([
        fetch(`/api/provision-purchases?${params}`),
        fetch(`/api/provision-usage?startDate=${startDate}&endDate=${endDateStr}`),
        fetch('/api/provisions'),
        fetch(`/api/expenses?${params}`),
        fetch(`/api/outsider-meal-records?${params}`),
        fetch(`/api/mando-meal-records?${params}`)
      ])

      const [provisionsData, provisionUsageData, provisionItemsData, expensesData, outsidersData, mandoData] = await Promise.all([
        provisionsRes.json(),
        provisionUsageRes.json(),
        provisionItemsRes.json(),
        expensesRes.json(),
        outsidersRes.json(),
        mandoRes.json()
      ])

      console.log('Fetched data - outsidersData length:', outsidersData.length, 'mandoData length:', mandoData.length)

      // Calculate provision purchases total
      const provisionsTotal = provisionsData.reduce((sum: number, item: any) => sum + parseFloat(item.totalAmount || 0), 0)

      // Calculate provision usage totals
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

      // Calculate inventory stock balance (purchased - used for the month)
      const inventoryStock = provisionItemsData.map((item: any) => {
        // Find total purchased for this item in the month
        const purchasedQuantity = provisionsData.reduce((sum: number, purchase: any) => {
          const itemPurchases = purchase.items?.filter((purchaseItem: any) => purchaseItem.provisionItem?.id === item.id) || []
          return sum + itemPurchases.reduce((itemSum: number, purchaseItem: any) => itemSum + parseFloat(purchaseItem.quantity || 0), 0)
        }, 0)

        // Find total used for this item in the month
        const usedQuantity = provisionUsageData.reduce((sum: number, usage: any) => {
          return usage.provisionItem?.id === item.id ? sum + parseFloat(usage.quantity || 0) : sum
        }, 0)

        const remainingQuantity = purchasedQuantity - usedQuantity

        return {
          id: item.id,
          name: item.name,
          unit: item.unit,
          unitCost: parseFloat(item.unitCost || 0),
          unitMeasure: item.unitMeasure,
          purchased: purchasedQuantity,
          used: usedQuantity,
          remaining: remainingQuantity
        }
      }).filter((item: any) => item.remaining > 0) // Only show items with remaining stock

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
  }, [selectedYear, selectedMonth, selectedSemester, outsiderRate, mandoRate, externalIncomes])

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
    return daysInMonth > 0 ? reportData.provisions.usage.totalCost / daysInMonth : 0
  }

  const [totalStudents, setTotalStudents] = useState<number>(0)

  const getTotalStudents = async (): Promise<number> => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const students = await response.json()
        const count = Array.isArray(students) ? students.length : 0
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

    return {
      labourPerStudent: totalStudents > 0 ? labourPerDay / totalStudents : 0,
      provisionPerStudent: totalStudents > 0 ? provisionPerDay / totalStudents : 0,
      totalPerStudent: totalStudents > 0 ? (labourPerDay + provisionPerDay) / totalStudents : 0,
      totalStudents
    }
  }

  const saveReport = async () => {
    if (!reportName.trim()) {
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
      }

      const summary = {
        totalExpenses,
        totalIncomes,
        netProfit,
      }

      const response = await fetch('/api/saved-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
          reportName: reportName.trim(),
          settings,
          summary,
        }),
      })

      if (response.ok) {
        const savedReport = await response.json()
        toast.success("Report saved successfully!")
        setShowSaveDialog(false)
        setReportName('')
        loadSavedReports()
      } else {
        throw new Error('Failed to save report')
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
      }
    } catch (error) {
      console.error('Error loading saved reports:', error)
      toast.error("Failed to load saved reports")
    } finally {
      setLoadingSavedReports(false)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Reports</h1>
          <p className="text-muted-foreground">Independent cost reports for each category</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <YearPicker
            value={selectedYear}
            onValueChange={setSelectedYear}
            className="w-32"
          />
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

          {/* Inventory Details Dialog */}
          <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
            <DialogContent className="max-w-4xl bg-white">
              <DialogHeader>
                <DialogTitle>Inventory Stock Balance - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Items with remaining stock after accounting for usage in the selected month.
                </div>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item Name</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Purchased</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Used</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Remaining</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Unit Cost</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.provisions.inventory.items.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.purchased.toFixed(2)} {item.unit}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.used.toFixed(2)} {item.unit}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-green-600">{item.remaining.toFixed(2)} {item.unit}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{item.unitCost.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{(item.remaining * item.unitCost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium">Total</td>
                        <td className="px-4 py-2 text-sm text-right">-</td>
                        <td className="px-4 py-2 text-sm text-right">-</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          {reportData?.provisions.inventory.items.reduce((sum: number, item: any) => sum + item.remaining, 0).toFixed(2)} units
                        </td>
                        <td className="px-4 py-2 text-sm text-right">-</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          ₹{reportData?.provisions.inventory.totalValue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setInventoryDialogOpen(false)}>
                    Close
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
        <div className="grid gap-6">
          {/* Provisions Report */}
          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Provisions Overview - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Provision Purchases */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Purchases</p>
                      <p className="text-xs text-blue-600">Total spent on provisions</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-blue-900">
                      ₹{reportData.provisions.totalCost.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Provision Usage */}
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Usage</p>
                      <p className="text-xs text-green-600">Provisions consumed</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-green-900">
                      ₹{reportData.provisions.usage.totalCost.toLocaleString()}
                    </div>
                    <p className="text-xs text-green-600">
                      {reportData.provisions.usage.totalQuantity.toFixed(2)} units used
                    </p>
                  </div>
                </div>

                {/* Inventory Stock */}
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Inventory</p>
                      <p className="text-xs text-purple-600">Stock balance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInventoryDialogOpen(true)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <UserCheck className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-purple-900">
                      ₹{reportData.provisions.inventory.totalValue.toLocaleString()}
                    </div>
                    <p className="text-xs text-purple-600">
                      {reportData.provisions.inventory.totalItems} items remaining
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-orange-600">
                  ₹{reportData.expenses.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reportData.expenses.count} expenses for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                </div>
                {Object.keys(reportData.expenses.byType).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {Object.entries(reportData.expenses.byType).map(([type, data]: [string, any]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-slate-600 capitalize">{type.toLowerCase()}:</span>
                        <span>{data.count} items (₹{data.amount.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Labour Charges Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-amber-600" />
                Labour Charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Monthly Labour Charge Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-800">Monthly Labour Charge</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-amber-700">₹</span>
                    <Input
                      type="number"
                      value={monthlyLabourCharge ?? ''}
                      onChange={(e) => setMonthlyLabourCharge(e.target.value ? parseFloat(e.target.value) : null)}
                      className="flex-1 h-10 text-lg font-semibold border-amber-300 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Per Day Calculation Display */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-amber-800">
                        Per Day Labour Charge
                      </div>
                      <div className="text-sm text-amber-600">
                        {getDaysInMonth(selectedYear, selectedMonth)} days in {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-700">
                        ₹{getPerDayLabourCharge().toFixed(2)}
                      </div>
                      <div className="text-xs text-amber-600">
                        per day
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Monthly Display */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                  <div className="text-sm font-medium text-amber-800">
                    Total Monthly Labour Cost
                  </div>
                  <div className="text-xl font-bold text-amber-700">
                    ₹{monthlyLabourCharge?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incomes Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                Mess Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      ₹{reportData.incomes.totalAdvancePaid.toLocaleString()}
                    </div>
                    <div className="text-sm text-emerald-700 font-medium">
                      Advance Paid
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Semester Selection</Label>
                    {loadingSemesters ? (
                      <div className="flex items-center justify-center h-8 w-32 border border-gray-300 rounded-md bg-white">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-emerald-600 mr-1"></div>
                        <span className="text-xs text-gray-600">Loading...</span>
                      </div>
                    ) : (
                      <Select value={selectedSemesterId} onValueChange={handleSemesterChange}>
                        <SelectTrigger className="w-48 h-8">
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

                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          ₹{reportData.incomes.bankInterestIncome.toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-700 flex items-center">
                          Bank Interest Income (
                          {editingInterestRate ? (
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={bankInterestRate}
                                onChange={(e) => setBankInterestRate(parseFloat(e.target.value) || 0)}
                                className="w-16 h-5 text-xs px-1"
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
                              className="cursor-pointer hover:bg-blue-100 px-1 rounded flex items-center space-x-1"
                              onClick={() => setEditingInterestRate(true)}
                            >
                              <span>{bankInterestRate.toFixed(2)}%</span>
                              <Pencil className="h-3 w-3 text-blue-500" />
                            </span>
                          )}
                          )
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Monthly Interest
                      </div>
                      <div className="text-xs text-gray-500">
                        For {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                      </div>
                    </div>
                  </div>

                  {/* External Incomes List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-purple-800">
                        Other External Income Sources
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddIncome(true)}
                        className="h-7 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Income
                      </Button>
                    </div>

                    {reportData.incomes.externalIncomes.length > 0 ? (
                      <div className="space-y-2">
                        {reportData.incomes.externalIncomes.map((income) => (
                          <div key={income.id} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-purple-900">{income.name}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-semibold text-purple-700">
                                ₹{income.amount.toLocaleString()}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExternalIncome(income.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-2 bg-purple-100 rounded border border-purple-300">
                          <div className="text-sm font-medium text-purple-900">Total External Income</div>
                          <div className="text-sm font-bold text-purple-800">
                            ₹{reportData.incomes.totalExternalIncome.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-purple-600 text-sm">
                        No external income sources added
                      </div>
                    )}

                    {/* Add Income Dialog */}
                    {showAddIncome && (
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-purple-800">Add New Income Source</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Income name"
                              value={newIncomeName}
                              onChange={(e) => setNewIncomeName(e.target.value)}
                              className="h-8 text-xs"
                            />
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-600">₹</span>
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={newIncomeAmount}
                                onChange={(e) => setNewIncomeAmount(e.target.value)}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addExternalIncome()
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddIncome(false)
                                setNewIncomeName('')
                                setNewIncomeAmount('')
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={addExternalIncome}
                              className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                            >
                              Add Income
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-green-700">
                          ₹{reportData.incomes.totalIncome.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-800 font-medium">
                          Total Income
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Advance + Interest + External
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {reportData.incomes.studentCount} students paid advance for {reportData.incomes.semesterName}
                </div>
                {selectedSemester && (
                  <div className="text-xs text-gray-500">
                    {new Date(selectedSemester.startDate).toLocaleDateString()} - {new Date(selectedSemester.endDate).toLocaleDateString()}
                  </div>
                )}
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
                <div className="text-sm text-muted-foreground flex items-center">
                  {reportData.outsiders.totalMeals} meals × ₹
                  {editingOutsiderRate ? (
                    <div className="flex items-center space-x-1 ml-1">
                      <Input
                        type="number"
                        value={outsiderRate}
                        onChange={(e) => setOutsiderRate(parseInt(e.target.value) || 0)}
                        className="w-16 h-6 text-xs px-1"
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
                      className="cursor-pointer hover:bg-green-100 px-1 rounded ml-1 flex items-center space-x-1"
                      onClick={() => setEditingOutsiderRate(true)}
                    >
                      <span>{outsiderRate}</span>
                      <Pencil className="h-3 w-3 text-green-500" />
                    </span>
                  )}
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
                <div className="text-sm text-muted-foreground flex items-center">
                  {reportData.mando.totalMeals} meals × ₹
                  {editingMandoRate ? (
                    <div className="flex items-center space-x-1 ml-1">
                      <Input
                        type="number"
                        value={mandoRate}
                        onChange={(e) => setMandoRate(parseInt(e.target.value) || 0)}
                        className="w-16 h-6 text-xs px-1"
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
                      className="cursor-pointer hover:bg-orange-100 px-1 rounded ml-1 flex items-center space-x-1"
                      onClick={() => setEditingMandoRate(true)}
                    >
                      <span>{mandoRate}</span>
                      <Pencil className="h-3 w-3 text-orange-500" />
                    </span>
                  )}
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

          {/* Per Student Per Day Cost Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                Per Student Per Day Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {perStudentCosts ? (
                  <>
                    <div className="text-sm text-gray-600 mb-4">
                      Based on {perStudentCosts.totalStudents} students for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Labour Charge Per Student */}
                      <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-800">Labour Charge</p>
                            <p className="text-xs text-amber-600">per student per day</p>
                          </div>
                          <Users className="h-8 w-8 text-amber-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold text-amber-900">
                            ₹{perStudentCosts.labourPerStudent.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Provision Usage Per Student */}
                      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">Provision Usage</p>
                            <p className="text-xs text-green-600">per student per day</p>
                          </div>
                          <Package className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold text-green-900">
                            ₹{perStudentCosts.provisionPerStudent.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Total Per Student */}
                      <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-800">Total Cost</p>
                            <p className="text-xs text-indigo-600">per student per day</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="mt-2">
                          <div className="text-3xl font-bold text-indigo-900">
                            ₹{perStudentCosts.totalPerStudent.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-sm font-medium text-gray-800 mb-2">Monthly Breakdown</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Labour Cost:</span>
                          <span className="font-semibold ml-2">₹{(perStudentCosts.labourPerStudent * perStudentCosts.totalStudents * getDaysInMonth(selectedYear, selectedMonth)).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Provision Cost:</span>
                          <span className="font-semibold ml-2">₹{(perStudentCosts.provisionPerStudent * perStudentCosts.totalStudents * getDaysInMonth(selectedYear, selectedMonth)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Calculating per student costs...</p>
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

      {/* Saved Reports Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Saved Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={loadSavedReports}
              disabled={loadingSavedReports}
              className="w-full"
            >
              {loadingSavedReports ? "Loading..." : "Load Saved Reports"}
            </Button>

            {savedReports.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  {savedReports.length} saved report(s) found
                </div>
                {savedReports.map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{report.reportName}</div>
                      <div className="text-sm text-gray-600">
                        {monthNames[report.month - 1]} {report.year} •
                        Expenses: ₹{report.summary?.totalExpenses?.toLocaleString() || '0'} •
                        Income: ₹{report.summary?.totalIncomes?.toLocaleString() || '0'} •
                        Net: ₹{report.summary?.netProfit?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Saved on {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadReport(report.id)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteReport(report.id, report.reportName)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No saved reports found. Save your first report using the "Save Bill" button.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Report Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md bg-white">
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
                    saveReport()
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-600">
              This will save all current report data including expenses, incomes, and calculations for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveReport} disabled={savingReport}>
              {savingReport ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

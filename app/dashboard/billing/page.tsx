"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, Filter, RotateCcw, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { computeMandays, AttendanceCode } from "@/lib/calculations"
import { DatePicker } from "@/components/ui/date-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StudentBillingData {
  id: string
  name: string
  rollNo: string
  dept: string | null
  hostel: string
  year?: number
  status?: string
  isMando?: boolean
  labourMandays: number
  provisionMandays: number
  laborCharge: number
  provisionCharge: number
  advancePaid: number
  carryForwardAmount: number
  totalAmount: number
  advanceAmountToPay: number
  feeRecordId?: number
}

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

interface FeeRecord {
  id: number
  studentId: string
  semesterId: number
  totalDue: number
  amountPaid: number
  balance: number
  paymentMode: string | null
  paymentDate: string
  student: {
    id: string
    name: string
    rollNo: string
    dept: string | null
    year?: number
    hostel: {
      name: string
    } | null
  }
  semester: {
    id: number
    name: string
    startDate: string
    endDate: string
  }
}

interface BillingSettings {
  perDayRate: number
  provisionPerDayRate: number
  advancePerDayRate: number
}

export default function BillingPage() {
  const { toast } = useToast()

  console.log("[DEBUG] === BILLING PAGE COMPONENT MOUNTED ===")

  // Semester states
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("")
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([])
  const [loadingSemesters, setLoadingSemesters] = useState(false)
  const [loadingFeeRecords, setLoadingFeeRecords] = useState(false)
  const activeSemesterIdRef = useRef<string | null>(null)

  // View mode states (Semester vs Month)
  const [viewMode, setViewMode] = useState<'semester' | 'month'>('semester')
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set())
  const [availableMonths, setAvailableMonths] = useState<Array<{
    value: string
    label: string
    year: number
    month: number
    startDate: Date
    endDate: Date
    isFirstMonth: boolean
    isLastMonth: boolean
  }>>([])
  const [monthStudentsData, setMonthStudentsData] = useState<StudentBillingData[]>([])
  const [loadingMonthData, setLoadingMonthData] = useState(false)
  const [monthSelectionError, setMonthSelectionError] = useState<string | null>(null)

  // Month-specific billing calculations
  const [monthTotalProvision, setMonthTotalProvision] = useState(0)
  const [monthProvisionPerDay, setMonthProvisionPerDay] = useState(0)
  const [monthLaborPerDay, setMonthLaborPerDay] = useState(0)
  const [monthTotalDays, setMonthTotalDays] = useState(0)
  const [loadingMonthProvision, setLoadingMonthProvision] = useState(false)

  // New semester creation states
  const [showCreateSemester, setShowCreateSemester] = useState(false)
  const [newSemesterName, setNewSemesterName] = useState("")
  const [newSemesterStartDate, setNewSemesterStartDate] = useState("")
  const [newSemesterEndDate, setNewSemesterEndDate] = useState("")
  const [newSemesterBaseAmount, setNewSemesterBaseAmount] = useState("")
  const [creatingSemester, setCreatingSemester] = useState(false)
  const [editingSemesterId, setEditingSemesterId] = useState<number | null>(null)

  // Legacy states (keeping for now)
  const [selectedStartYear, setSelectedStartYear] = useState(new Date().getFullYear().toString())
  const [selectedEndYear, setSelectedEndYear] = useState(new Date().getFullYear().toString())
  const [selectedStartMonth, setSelectedStartMonth] = useState("1")
  const [selectedEndMonth, setSelectedEndMonth] = useState("6")
  const [semLaborCharge, setSemLaborCharge] = useState(45)
  const [semProvisionCharge, setSemProvisionCharge] = useState(25)
  const [semAdvanceAmount, setSemAdvanceAmount] = useState(15000)
  const [calculatedProvisionCharge, setCalculatedProvisionCharge] = useState(0)
  const [totalProvisionUsage, setTotalProvisionUsage] = useState(0)
  const [loadingProvisionCharge, setLoadingProvisionCharge] = useState(false)
  const [updatingSem, setUpdatingSem] = useState(false)
  const [studentsSem, setStudentsSem] = useState<StudentBillingData[]>([])
  const [loadingStudentsSem, setLoadingStudentsSem] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [updatingPayments, setUpdatingPayments] = useState(false)
  const [markingSelectedPaid, setMarkingSelectedPaid] = useState(false)
  const [loadingStudentPayments, setLoadingStudentPayments] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    status: "all",
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

  const [totalSemesterDays, setTotalSemesterDays] = useState(0)
  const [overallLaborCharge, setOverallLaborCharge] = useState("")

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  // New helper to fetch saved labor rate for a semester
  const fetchSemesterLaborRate = async (semester: Semester): Promise<number | null> => {
    try {
      const startDate = new Date(semester.startDate)
      const year = startDate.getFullYear()
      const month = startDate.getMonth() + 1

      const response = await fetch(`/api/billing/overview?year=${year}&month=${month}&t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.bill && data.bill.perDayRate) {
          return parseFloat(data.bill.perDayRate)
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching semester labor rate:", error)
      return null
    }
  }

  // Fetch semesters
  const fetchSemesters = async () => {
    console.log("[DEBUG] === FETCHING SEMESTERS START ===")
    setLoadingSemesters(true)
    try {
      const response = await fetch('/api/semesters')
      console.log("[DEBUG] Semesters API response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[DEBUG] Fetched semesters:", data.length, "semesters")
        console.log("[DEBUG] Semester data:", data.map((s: any) => ({ id: s.id, name: s.name })))
        setSemesters(data)
        if (data.length > 0 && !selectedSemesterId) {
          const firstSemester = data[0]
          console.log("[DEBUG] Auto-selecting first semester:", firstSemester.name)
          setSelectedSemesterId(firstSemester.id.toString())
          activeSemesterIdRef.current = firstSemester.id.toString()
          setSelectedSemester(firstSemester)

          // Calculate total days for the auto-selected semester
          const startDate = new Date(firstSemester.startDate)
          const endDate = new Date(firstSemester.endDate)
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          setTotalSemesterDays(totalDays)

          // Fetch saved rate
          const savedRate = await fetchSemesterLaborRate(firstSemester)
          if (savedRate !== null) {
            console.log("[DEBUG] Found saved labor rate:", savedRate)
            setSemLaborCharge(savedRate)
            // Also initialize overall charge
            if (totalDays > 0) {
              const calculated = (savedRate * totalDays).toFixed(2)
              setOverallLaborCharge(calculated.endsWith('.00') ? calculated.slice(0, -3) : calculated)
            }
          }

          // The useEffect will handle the data fetching
        } else {
          console.log("[DEBUG] No semesters to auto-select or semester already selected")
        }
      } else {
        console.error("[DEBUG] Failed to fetch semesters, status:", response.status)
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching semesters:", error)
    } finally {
      setLoadingSemesters(false)
      console.log("[DEBUG] === FETCHING SEMESTERS END ===")
    }
  }

  // Fetch fee records for selected semester
  const fetchFeeRecords = async (semesterId: string) => {
    setLoadingFeeRecords(true)
    try {
      console.log("[DEBUG] Fetching fee records for semester:", semesterId)

      const response = await fetch(`/api/fee-records?semesterId=${semesterId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[DEBUG] Fee records fetched:", data.length, "records")

        // If no fee records exist for this semester, create them for all students
        if (data.length === 0 && selectedSemester) {
          console.log("[DEBUG] No fee records found, creating for all students")
          await createFeeRecordsForAllStudents(semesterId)
          // Fetch again after creating
          const retryResponse = await fetch(`/api/fee-records?semesterId=${semesterId}`)
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            console.log("[DEBUG] Fee records after creation:", retryData.length, "records")
            setFeeRecords(retryData)
          }
        } else {
          setFeeRecords(data)
        }
      } else {
        console.error("[DEBUG] Failed to fetch fee records, status:", response.status)
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching fee records:", error)
    } finally {
      setLoadingFeeRecords(false)
    }
  }

  // Create fee records for all students in a semester
  const createFeeRecordsForAllStudents = async (semesterId: string) => {
    try {
      console.log("[DEBUG] Creating fee records for all students")

      // First get all students
      const studentsResponse = await fetch('/api/students')
      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students")
      }
      const students = await studentsResponse.json()
      console.log("[DEBUG] Found", students.length, "students")

      // Create fee records for each student
      const promises = students.map(async (student: any) => {
        try {
          const response = await fetch('/api/fee-records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: student.id,
              semesterId: parseInt(semesterId),
              amountPaid: 0, // Start with no payment
              paymentMode: null
            }),
          })

          if (!response.ok) {
            console.error(`[DEBUG] Failed to create fee record for student ${student.name}`)
          }
        } catch (error) {
          console.error(`[DEBUG] Error creating fee record for student ${student.name}:`, error)
        }
      })

      await Promise.all(promises)
      console.log("[DEBUG] Finished creating fee records for all students")
    } catch (error) {
      console.error("[DEBUG] Error creating fee records for all students:", error)
    }
  }

  // Create new semester
  const createNewSemester = async () => {
    if (!newSemesterName || !newSemesterStartDate || !newSemesterEndDate || !newSemesterBaseAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    setCreatingSemester(true)
    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSemesterName,
          startDate: newSemesterStartDate,
          endDate: newSemesterEndDate,
          baseAmount: newSemesterBaseAmount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Semester Created",
          description: `Semester "${data.semester.name}" created successfully`,
        })

        // Reset form and refresh data
        setNewSemesterName("")
        setNewSemesterStartDate("")
        setNewSemesterEndDate("")
        setNewSemesterBaseAmount("")
        setShowCreateSemester(false)
        await fetchSemesters()
      } else {
        throw new Error("Failed to create semester")
      }
    } catch (error) {
      console.error("Error creating semester:", error)
      toast({
        title: "Creation Failed",
        description: "Failed to create semester. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreatingSemester(false)
    }
  }

  // Calculate provision charge per day for semester
  const calculateProvisionChargePerDay = async (semester: Semester) => {
    console.log("[DEBUG] === PROVISION CHARGE CALCULATION STARTED ===")
    console.log("[DEBUG] FUNCTION CALLED - calculateProvisionChargePerDay")
    console.log("[DEBUG] Starting provision charge calculation for semester:", semester.name)
    console.log("[DEBUG] Semester object received:", JSON.stringify(semester, null, 2))
    setLoadingProvisionCharge(true)

    try {
      const startDate = new Date(semester.startDate)
      const endDate = new Date(semester.endDate)

      console.log("[DEBUG] Semester dates:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      // Calculate total days in semester
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 // +1 to include end date
      console.log("[DEBUG] Total days in semester:", totalDays)

      // Fetch provision usage for the semester period
      const apiUrl = `/api/provision-usage?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      console.log("[DEBUG] Fetching provision usage from:", apiUrl)

      const response = await fetch(apiUrl)
      console.log("[DEBUG] Provision usage API response status:", response.status)

      if (response.ok) {
        const provisionUsage = await response.json()
        console.log("[DEBUG] Provision usage records fetched:", provisionUsage.length)

        // Calculate total provision cost used
        const totalCost = provisionUsage.reduce((sum: number, usage: any) => {
          const cost = Number(usage.quantity) * Number(usage.provisionItem?.unitCost || 0)
          return sum + cost
        }, 0)

        console.log("[DEBUG] Total provision cost used (Gross):", totalCost)

        // NEW: Fetch Mando Meal Records to subtract their cost
        let mandoDeduction = 0
        try {
          const mandoUrl = `/api/mando-meal-records?startDate=${startDate}&endDate=${endDate}`
          const mandoRes = await fetch(mandoUrl)
          if (mandoRes.ok) {
            const mandoRecords = await mandoRes.json()
            // Calculate total mando cost: sum of (meals * rate)
            // Each record has breakfast/lunch/dinner booleans and a mealRate
            mandoDeduction = mandoRecords.reduce((sum: number, record: any) => {
              const mealsCount = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)
              return sum + (mealsCount * Number(record.mealRate || 50))
            }, 0)
            console.log("[DEBUG] Mando deduction calculated:", mandoDeduction, "from", mandoRecords.length, "records")
          } else {
            console.error("[DEBUG] Failed to fetch Mando records for deduction")
          }
        } catch (mandoErr) {
          console.error("[DEBUG] Error calculating Mando deduction:", mandoErr)
        }

        const netProvisionCost = Math.max(0, totalCost - mandoDeduction)
        console.log("[DEBUG] Net Provision Cost:", netProvisionCost, "(", totalCost, "-", mandoDeduction, ")")

        // Store total provision usage cost (Net)
        setTotalProvisionUsage(netProvisionCost)

        // Calculate provision charge per day
        const provisionChargePerDay = totalDays > 0 ? netProvisionCost / totalDays : 0
        console.log("[DEBUG] Provision charge per day calculated:", provisionChargePerDay)

        setCalculatedProvisionCharge(provisionChargePerDay)
        setSemProvisionCharge(provisionChargePerDay)

        console.log("[DEBUG] Provision charge calculated, data refresh will be handled by force refresh mechanism")

        return provisionChargePerDay
      } else {
        const errorText = await response.text()
        console.error("[DEBUG] Failed to fetch provision usage. Status:", response.status, "Response:", errorText)
        setCalculatedProvisionCharge(0)
        setSemProvisionCharge(0)
        return 0
      }
    } catch (error) {
      console.error("[DEBUG] Error calculating provision charge:", error)
      setCalculatedProvisionCharge(0)
      setSemProvisionCharge(0)
      setTotalProvisionUsage(0)
      return 0
    } finally {
      console.log("[DEBUG] Finished provision charge calculation")
      console.log("[DEBUG] === PROVISION CHARGE CALCULATION COMPLETED ===")
      setLoadingProvisionCharge(false)
    }
  }

  // Calculate provision costs specifically for selected months
  const fetchMonthProvisionCosts = async () => {
    if (!selectedSemester || selectedMonths.size === 0) {
      setMonthTotalProvision(0)
      setMonthProvisionPerDay(0)
      setMonthLaborPerDay(0)
      setMonthTotalDays(0)
      return
    }

    setLoadingMonthProvision(true)
    try {
      // Get selected months info sorted by date
      const selectedMonthsInfo = availableMonths
        .filter(m => selectedMonths.has(m.value))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

      if (selectedMonthsInfo.length === 0) {
        setMonthTotalProvision(0)
        setMonthProvisionPerDay(0)
        setMonthLaborPerDay(0)
        setMonthTotalDays(0)
        return
      }

      // Calculate total days in selected months
      const totalDays = selectedMonthsInfo.reduce((sum, m) =>
        sum + Math.ceil((m.endDate.getTime() - m.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        , 0)
      setMonthTotalDays(totalDays)

      // Calculate labor per day
      // Check if there is a saved monthly rate for the LAST selected month (to match UI expectation)
      let laborPerDay = semLaborCharge

      if (selectedMonthsInfo.length > 0) {
        try {
          const lastMonth = selectedMonthsInfo[selectedMonthsInfo.length - 1]
          console.log(`[DEBUG] Fetching rate for month: ${lastMonth.month}/${lastMonth.year}`)


          // Fetch global rate for this Month/Year (ignoring semester Id to share rates across overlapping semesters)
          const rateRes = await fetch(`/api/monthly-rates?month=${lastMonth.month}&year=${lastMonth.year}&t=${Date.now()}`, {
            cache: 'no-store'
          })

          if (rateRes.ok) {
            const rates = await rateRes.json()
            console.log("[DEBUG] Fetched rates:", rates)
            if (rates.length > 0) {
              laborPerDay = parseFloat(rates[0].laborRate)
              console.log("[DEBUG] Using saved rate:", laborPerDay)
            } else {
              console.log("[DEBUG] No saved rate found, using semester default")
            }
          }
        } catch (err) {
          console.error("Error fetching monthly labor rate:", err)
        }
      }

      setMonthLaborPerDay(laborPerDay)

      // Update overall labor charge display based on the fetched/calculated rate
      if (totalDays > 0) {
        const calculatedOverall = (laborPerDay * totalDays).toFixed(2)
        setOverallLaborCharge(calculatedOverall.endsWith('.00') ? calculatedOverall.slice(0, -3) : calculatedOverall)
      } else {
        setOverallLaborCharge("0")
      }

      // Fetch provision usage for the selected months' date range
      // Format dates as YYYY-MM-DD without timezone offset issues
      const formatDateForApi = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const startDate = formatDateForApi(selectedMonthsInfo[0].startDate)
      const endDate = formatDateForApi(selectedMonthsInfo[selectedMonthsInfo.length - 1].endDate)

      console.log("[DEBUG] Selected months:", selectedMonthsInfo.map(m => m.label).join(", "))

      // Fetch provision usage for each selected month individually (handles non-contiguous selection)
      let totalProvisionCost = 0
      for (const month of selectedMonthsInfo) {
        const monthStartDate = formatDateForApi(month.startDate)
        const monthEndDate = formatDateForApi(month.endDate)

        console.log(`[DEBUG] Fetching provision for ${month.label}: ${monthStartDate} to ${monthEndDate}`)

        const provisionUrl = `/api/provision-usage?startDate=${monthStartDate}&endDate=${monthEndDate}`
        const provisionRes = await fetch(provisionUrl)

        if (provisionRes.ok) {
          const provisionData = await provisionRes.json()
          console.log(`[DEBUG] ${month.label} provision records:`, provisionData.length)

          const monthCost = provisionData.reduce((sum: number, record: any) => {
            const quantity = parseFloat(record.quantity || 0)
            const unitCost = parseFloat(record.provisionItem?.unitCost || 0)
            return sum + (quantity * unitCost)
          }, 0)
          console.log(`[DEBUG] ${month.label} provision cost:`, monthCost)
          totalProvisionCost += monthCost
        }
      }
      console.log("[DEBUG] Total provision cost for all selected months:", totalProvisionCost)

      // Fetch mando meal records for each selected month individually
      let mandoDeduction = 0
      for (const month of selectedMonthsInfo) {
        const monthStartDate = formatDateForApi(month.startDate)
        const monthEndDate = formatDateForApi(month.endDate)

        try {
          const mandoUrl = `/api/mando-meal-records?startDate=${monthStartDate}&endDate=${monthEndDate}`
          const mandoRes = await fetch(mandoUrl)
          if (mandoRes.ok) {
            const mandoRecords = await mandoRes.json()
            const monthMandoCost = mandoRecords.reduce((sum: number, record: any) => {
              const mealsCount = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)
              return sum + (mealsCount * Number(record.mealRate || 50))
            }, 0)
            console.log(`[DEBUG] ${month.label} mando deduction:`, monthMandoCost)
            mandoDeduction += monthMandoCost
          }
        } catch (err) {
          console.error(`[DEBUG] Error fetching mando records for ${month.label}:`, err)
        }
      }
      console.log("[DEBUG] Total mando deduction:", mandoDeduction)

      // Net provision cost
      const netProvision = Math.max(0, totalProvisionCost - mandoDeduction)
      setMonthTotalProvision(netProvision)

      // Per day provision cost
      const provisionPerDay = totalDays > 0 ? netProvision / totalDays : 0
      setMonthProvisionPerDay(provisionPerDay)

      console.log("[DEBUG] Month provision per day:", provisionPerDay)

    } catch (error) {
      console.error("[DEBUG] Error fetching month provision costs:", error)
      setMonthTotalProvision(0)
      setMonthProvisionPerDay(0)
      setMonthLaborPerDay(0)
      setMonthTotalDays(0)
    } finally {
      setLoadingMonthProvision(false)
    }
  }

  // Force reset all semester-related state
  const forceResetSemesterState = () => {
    console.log("[DEBUG] === FORCE RESETTING ALL SEMESTER STATE ===")
    setSelectedSemester(null)
    setStudentsSem([])
    setCalculatedProvisionCharge(0)
    setTotalProvisionUsage(0)
    setSemAdvanceAmount(0)
    setLoadingProvisionCharge(false)
    setLoadingStudentsSem(false)
    setSelectedStudents(new Set())
    setSelectAll(false)
    setFeeRecords([])
    setLoadingFeeRecords(false)
    console.log("[DEBUG] === FORCE RESET COMPLETED ===")
  }

  // Force refetch data for a specific semester
  const forceRefetchSemesterData = async (semester: Semester) => {
    console.log("[DEBUG] === FORCE REFETCHING SEMESTER DATA ===")
    console.log("[DEBUG] Force refetching for semester:", semester.name)

    try {
      setLoadingProvisionCharge(true)

      // Step 1: Fetch saved rate first to ensure calculations use correct rate
      const savedRate = await fetchSemesterLaborRate(semester)
      if (savedRate !== null) {
        console.log("[DEBUG] Force refetch using saved rate:", savedRate)
        setSemLaborCharge(savedRate)
        // Update overall charge display ONLY if in semester view
        // In month view, fetchMonthProvisionCosts handles this
        if (viewMode === 'semester') {
          const startDate = new Date(semester.startDate)
          const endDate = new Date(semester.endDate)
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          if (totalDays > 0) {
            const calculated = (savedRate * totalDays).toFixed(2)
            setOverallLaborCharge(calculated.endsWith('.00') ? calculated.slice(0, -3) : calculated)
          }
        }
      }

      // Step 2: Calculate provision charge
      console.log("[DEBUG] Step 2: Calculating provision charge")
      const calculatedProvisionRate = await calculateProvisionChargePerDay(semester)

      // Step 3: Wait longer for state to settle and async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if semester changed during wait
      if (semester.id.toString() !== activeSemesterIdRef.current) {
        console.log("[DEBUG] Semester changed during refetch wait, cancelling update")
        return
      }

      // Step 4: Fetch student data with explicit params to avoid stale state
      console.log("[DEBUG] Step 4: Fetching student data with fresh params")
      await fetchSemStudentsData(semester, savedRate || undefined, calculatedProvisionRate)

    } catch (error) {
      console.error("[DEBUG] Error in force refetch sequence:", error)
    } finally {
      setLoadingStudentsSem(false)
      setLoadingProvisionCharge(false)
      console.log("[DEBUG] === FORCE REFETCH COMPLETED ===")
    }
  }

  // Handle semester selection
  const handleSemesterChange = (semesterId: string) => {
    console.log("[DEBUG] === SEMESTER SELECTION START ===")
    console.log("[DEBUG] FUNCTION CALLED - handleSemesterChange with ID:", semesterId)

    // Step 1: Force reset all state immediately
    setSelectedSemesterId(semesterId)
    activeSemesterIdRef.current = semesterId
    forceResetSemesterState()

    if (semesterId === "create-new") {
      console.log("[DEBUG] Creating new semester")
      setShowCreateSemester(true)
      setSelectedSemester(null)
    } else {
      console.log("[DEBUG] Looking for semester with ID:", semesterId)
      const semester = semesters.find(s => s.id.toString() === semesterId)

      if (semester) {
        console.log("[DEBUG] Found semester:", semester.name)
        setSelectedSemester(semester)
        setShowCreateSemester(false)

        // Calculate total days
        const startDate = new Date(semester.startDate)
        const endDate = new Date(semester.endDate)
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        setTotalSemesterDays(totalDays)

        // Step 2: Set basic semester data
        const baseAmount = semester.feeStructures[0]?.baseAmount || 0
        setSemAdvanceAmount(baseAmount)

        // The useEffect will handle the data fetching
        // We will fetch the rate in useEffect -> forceRefetchSemesterData
      } else {
        console.log("[DEBUG] No semester found for ID:", semesterId)
        setShowCreateSemester(false)
        setSelectedSemester(null)
      }
    }
    console.log("[DEBUG] === SEMESTER SELECTION END ===")
  }

  // Helper function to get months within a semester date range
  const getMonthsInSemester = (semester: Semester) => {
    const months: Array<{
      value: string
      label: string
      year: number
      month: number
      startDate: Date
      endDate: Date
      isFirstMonth: boolean
      isLastMonth: boolean
    }> = []

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]

    const semesterStart = new Date(semester.startDate)
    const semesterEnd = new Date(semester.endDate)

    // Start from the month of semester start
    let currentDate = new Date(semesterStart.getFullYear(), semesterStart.getMonth(), 1)
    let isFirst = true

    while (currentDate <= semesterEnd) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()

      // Calculate start date for this month (ALWAYS 1st of the month)
      const monthStart = new Date(year, month, 1)

      // Calculate end date for this month (ALWAYS last day of the month)
      const monthEnd = new Date(year, month + 1, 0)

      const isLast = (year === semesterEnd.getFullYear() && month === semesterEnd.getMonth())

      // Conflict Resolution: Check if this month belongs to another semester (has more days)
      // Calculate overlap days for THIS semester
      const overlapStart = new Date(Math.max(monthStart.getTime(), semesterStart.getTime()))
      const overlapEnd = new Date(Math.min(monthEnd.getTime(), semesterEnd.getTime()))
      let myOverlapDays = 0
      if (overlapEnd >= overlapStart) {
        myOverlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }

      // Check other semesters to see if they lay better claim to this month
      let belongsToOther = false
      if (semesters && semesters.length > 0) {
        for (const otherSem of semesters) {
          if (otherSem.id === semester.id) continue;

          const otherSemStart = new Date(otherSem.startDate)
          const otherSemEnd = new Date(otherSem.endDate)

          const otherOverlapStart = new Date(Math.max(monthStart.getTime(), otherSemStart.getTime()))
          const otherOverlapEnd = new Date(Math.min(monthEnd.getTime(), otherSemEnd.getTime()))

          if (otherOverlapEnd >= otherOverlapStart) {
            const otherOverlapDays = Math.ceil((otherOverlapEnd.getTime() - otherOverlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

            // If another semester has MORE days of this month, it belongs to them.
            if (otherOverlapDays > myOverlapDays) {
              belongsToOther = true;
              break;
            }
          }
        }
      }

      if (belongsToOther) {
        // Skip adding this month as it belongs to another semester
        currentDate = new Date(year, month + 1, 1)
        // Note: We do NOT set isFirst=false here, so the next month that IS added will be marked isFirst=true
        continue
      }

      months.push({
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: `${monthNames[month]} ${year}`,
        year,
        month: month + 1,
        startDate: monthStart,
        endDate: monthEnd,
        isFirstMonth: isFirst,
        isLastMonth: isLast,
      })

      // Move to next month
      currentDate = new Date(year, month + 1, 1)
      isFirst = false
    }

    return months
  }

  // Update available months when semester changes
  useEffect(() => {
    if (selectedSemester) {
      // CRITICAL: Reset month view data immediately to prevent showing stale data
      setMonthStudentsData([])
      setMonthTotalProvision(0)
      setMonthProvisionPerDay(0)
      setMonthLaborPerDay(0)
      setMonthTotalDays(0)

      const months = getMonthsInSemester(selectedSemester)
      setAvailableMonths(months)

      // Clear month selection - user must manually select a month
      // This avoids data fetching issues with stale state during auto-selection
      setSelectedMonths(new Set())
    } else {
      setAvailableMonths([])
      setSelectedMonths(new Set())
      setMonthStudentsData([])
    }
  }, [selectedSemester])

  // Edit semester
  const editSemester = async (semester: Semester) => {
    setNewSemesterName(semester.name)
    setNewSemesterStartDate(semester.startDate)
    setNewSemesterEndDate(semester.endDate)
    setNewSemesterBaseAmount(semester.feeStructures[0]?.baseAmount.toString() || "")
    setEditingSemesterId(semester.id)
    setShowCreateSemester(true)
  }

  // Update semester
  const updateSemester = async () => {
    if (!editingSemesterId || !newSemesterName || !newSemesterStartDate || !newSemesterEndDate || !newSemesterBaseAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    setCreatingSemester(true)
    try {
      const response = await fetch('/api/semesters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingSemesterId,
          name: newSemesterName,
          startDate: newSemesterStartDate,
          endDate: newSemesterEndDate,
          baseAmount: newSemesterBaseAmount,
        }),
      })

      if (response.ok) {
        toast({
          title: "Semester Updated",
          description: `Semester "${newSemesterName}" updated successfully`,
        })

        // Reset form and refresh data
        setNewSemesterName("")
        setNewSemesterStartDate("")
        setNewSemesterEndDate("")
        setNewSemesterBaseAmount("")
        setEditingSemesterId(null)
        setShowCreateSemester(false)
        await fetchSemesters()
      } else {
        throw new Error("Failed to update semester")
      }
    } catch (error) {
      console.error("Error updating semester:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update semester. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreatingSemester(false)
    }
  }

  // Delete semester
  const deleteSemester = async (semesterId: number, semesterName: string) => {
    if (!confirm(`Are you sure you want to delete the semester "${semesterName}"? This will also delete all associated fee records.`)) {
      return
    }

    try {
      const response = await fetch(`/api/semesters?id=${semesterId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Semester Deleted",
          description: `Semester "${semesterName}" deleted successfully`,
        })

        // Reset selection if deleted semester was selected
        if (selectedSemesterId === semesterId.toString()) {
          setSelectedSemesterId("")
          forceResetSemesterState()
        }

        await fetchSemesters()
      } else {
        throw new Error("Failed to delete semester")
      }
    } catch (error) {
      console.error("Error deleting semester:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete semester. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Mark payment as paid
  const markAsPaid = async (studentId: string, semesterId: number) => {
    if (!selectedSemester) return

    try {
      const response = await fetch('/api/fee-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          semesterId,
          amountPaid: selectedSemester.feeStructures[0]?.baseAmount || 0,
          paymentMode: 'cash'
        }),
      })

      if (response.ok) {
        toast({
          title: "Payment Recorded",
          description: "Student payment has been marked as paid",
        })
        fetchFeeRecords(semesterId.toString())
      } else {
        throw new Error("Failed to record payment")
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error)
      toast({
        title: "Payment Failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update payment amount
  const updatePayment = async (studentId: string, semesterId: number, newAmount: number) => {
    try {
      const response = await fetch('/api/fee-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          semesterId,
          amountPaid: newAmount,
          paymentMode: 'cash'
        }),
      })

      if (response.ok) {
        toast({
          title: "Payment Updated",
          description: "Student payment amount has been updated",
        })
        fetchFeeRecords(semesterId.toString())
      } else {
        throw new Error("Failed to update payment")
      }
    } catch (error) {
      console.error("Error updating payment:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update payments (save Balance Amount as carry forward for current semester)
  const updatePayments = async () => {
    if (!selectedSemester) return

    setUpdatingPayments(true)
    try {
      // Update fee records for current semester with balance amounts as carry forward
      const updatePromises = studentsSem.map(async (student) => {
        try {
          if (!student.feeRecordId) {
            console.warn(`No fee record ID for student ${student.name}, skipping`)
            return
          }

          const response = await fetch('/api/fee-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: student.id,
              semesterId: selectedSemester.id,
              amountPaid: student.advancePaid, // Keep current payment
              paymentMode: 'cash',
              feeRecordId: student.feeRecordId,
              updateBalance: true,
              newBalance: student.totalAmount, // Set balance to balance amount (can be negative)
            }),
          })

          if (!response.ok) {
            console.error(`Failed to update balance for student ${student.name}`)
          }
        } catch (error) {
          console.error(`Error updating balance for student ${student.name}:`, error)
        }
      })

      await Promise.all(updatePromises)

      toast({
        title: "Payments Updated",
        description: `Saved balance amounts as carry forward for ${selectedSemester.name}`,
      })

      // Refresh data
      fetchSemStudentsData()
    } catch (error) {
      console.error("Error updating payments:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPayments(false)
    }
  }

  // Update payments for Month View (save Balance Amount for selected months)
  const updateMonthlyPayments = async () => {
    if (!selectedSemester || selectedMonths.size === 0 || monthStudentsData.length === 0) return

    setUpdatingPayments(true)
    try {
      // Get selected months info sorted by date
      const selectedMonthsInfo = availableMonths
        .filter(m => selectedMonths.has(m.value))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

      // Build balance records for each student for the last selected month
      // (balance represents end-of-month state)
      const lastMonth = selectedMonthsInfo[selectedMonthsInfo.length - 1]

      const balances = monthStudentsData.map(student => ({
        studentId: student.id,
        semesterId: selectedSemester.id,
        month: lastMonth.month,
        year: lastMonth.year,
        balance: student.totalAmount,
        laborDays: student.labourMandays,
        provisionDays: student.provisionMandays,
        laborCharge: student.laborCharge,
        provisionCharge: student.provisionCharge,
      }))

      const response = await fetch('/api/monthly-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semesterId: selectedSemester.id,
          month: lastMonth.month,
          year: lastMonth.year,
          balances,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Monthly Payments Updated",
          description: `Saved ${result.updated} balance records for ${lastMonth.label}`,
        })

        // Refresh data
        fetchMonthStudentsData()
      } else {
        throw new Error("Failed to update monthly balances")
      }
    } catch (error) {
      console.error("Error updating monthly payments:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update monthly payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPayments(false)
    }
  }


  // Handle individual student payment actions
  const handleStudentPayment = async (studentId: string, action: 'markPaid' | 'markUnpaid' | 'editAmount', amount?: number) => {
    if (!selectedSemester) return

    // Add student to loading set
    setLoadingStudentPayments(prev => new Set(prev).add(studentId))

    try {
      let paymentAmount = 0

      // Find the student to get their advance amount to pay
      const student = studentsSem.find(s => s.id === studentId)

      if (action === 'markPaid') {
        // Use the advance amount to pay (which includes carry forward adjustments)
        paymentAmount = student?.advanceAmountToPay || 0
      } else if (action === 'markUnpaid') {
        paymentAmount = 0
      } else if (action === 'editAmount' && amount !== undefined) {
        paymentAmount = amount
      }

      const feeRecordId = student?.feeRecordId

      const response = await fetch('/api/fee-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          semesterId: selectedSemester.id,
          amountPaid: paymentAmount,
          paymentMode: paymentAmount > 0 ? 'cash' : null,
          feeRecordId, // Pass the fee record ID for updates
        }),
      })

      if (response.ok) {
        const actionText = action === 'markPaid' ? 'marked as paid' :
          action === 'markUnpaid' ? 'marked as unpaid' :
            'payment amount updated'

        toast({
          title: "Payment Updated",
          description: `Student payment ${actionText}`,
        })

        fetchSemStudentsData()
      } else {
        throw new Error("Failed to update payment")
      }
    } catch (error) {
      console.error("Error updating student payment:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update student payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Remove student from loading set
      setLoadingStudentPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(studentId)
        return newSet
      })
    }
  }

  // Handle bulk mark as paid
  const handleBulkMarkPaid = async () => {
    if (selectedStudents.size === 0 || !selectedSemester) return

    setMarkingSelectedPaid(true)
    try {
      const bulkPromises = Array.from(selectedStudents).map(studentId =>
        handleStudentPayment(studentId, 'markPaid')
      )

      await Promise.all(bulkPromises)

      toast({
        title: "Bulk Payment Updated",
        description: `${selectedStudents.size} students marked as paid`,
      })

      setSelectedStudents(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error("Error in bulk payment update:", error)
      toast({
        title: "Bulk Update Failed",
        description: "Some payments may not have been updated. Please check and try again.",
        variant: "destructive",
      })
    } finally {
      setMarkingSelectedPaid(false)
    }
  }

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedStudents(new Set(filteredStudentsSem.map(student => student.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  // Handle individual student selection
  const handleStudentSelect = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
    setSelectAll(newSelected.size === filteredStudentsSem.length)
  }

  const updateSemBillingSettings = async () => {
    if (!selectedSemester) return

    setUpdatingSem(true)

    // Handle Month View Updates (Save to MonthlyRate table)
    if (viewMode === 'month' && selectedMonths.size > 0) {
      try {
        const promises = Array.from(selectedMonths).map(async (monthValue) => {
          const monthData = availableMonths.find(m => m.value === monthValue)
          if (!monthData) return

          // Use monthLaborPerDay from state
          // For provision, we use monthTotalProvision / totalDays if available, or just keeping the existing flow
          // Ideally we save the rate.

          await fetch('/api/monthly-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              semesterId: selectedSemester.id,
              month: monthData.month,
              year: monthData.year,
              laborRate: monthLaborPerDay,
              provisionRate: monthProvisionPerDay > 0 ? monthProvisionPerDay : null
            })
          })
        })

        await Promise.all(promises)

        toast({
          title: "Monthly Rates Saved",
          description: `Different labor/provision rates saved for ${selectedMonths.size} selected month(s).`,
        })

        fetchMonthStudentsData() // Refresh
      } catch (error) {
        console.error("Error saving monthly rates:", error)
        toast({
          title: "Update Failed",
          description: "Failed to save monthly rates.",
          variant: "destructive"
        })
      } finally {
        setUpdatingSem(false)
      }
      return
    }

    // Handle Semester View Updates (Legacy / Standard)
    const startDate = new Date(selectedSemester.startDate)
    const endDate = new Date(selectedSemester.endDate)

    const periods: { year: number; month: number }[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      periods.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      })
      currentDate.setMonth(currentDate.getMonth() + 1)
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
            advancePerDayRate: 0,
          }),
        })
        if (!response.ok) {
          throw new Error(`Failed to update ${month}/${year}`)
        }
      })

      await Promise.all(promises)

      toast({
        title: "Settings Updated",
        description: `Billing parameters updated for all months in ${selectedSemester.name}.`,
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

  const exportToCSV = () => {
    if (!selectedSemester) return
    if (viewMode === 'month' && selectedMonths.size === 0) return

    // Determine data source and filename based on view mode
    const isMonthView = viewMode === 'month'
    const dataSource = isMonthView ? monthStudentsData : filteredStudentsSem

    // Get selected months info for filename and parameters
    const selectedMonthsInfo = isMonthView
      ? availableMonths.filter(m => selectedMonths.has(m.value)).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      : []

    const monthsLabel = isMonthView
      ? selectedMonthsInfo.map(m => m.label.split(' ')[0]).join('-')
      : ''

    const filename = isMonthView
      ? `billing-${selectedSemester.name.replace(/\s+/g, '-').toLowerCase()}-${monthsLabel.toLowerCase()}.csv`
      : `billing-${selectedSemester.name.replace(/\s+/g, '-').toLowerCase()}.csv`

    // Calculate total days
    let startDate: Date, endDate: Date, totalDays: number
    if (isMonthView && selectedMonthsInfo.length > 0) {
      startDate = selectedMonthsInfo[0].startDate
      endDate = selectedMonthsInfo[selectedMonthsInfo.length - 1].endDate
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    } else {
      startDate = new Date(selectedSemester.startDate)
      endDate = new Date(selectedSemester.endDate)
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Determine if first month is included (for Adv Paid column)
    const includesFirstMonth = isMonthView
      ? selectedMonthsInfo.some(m => m.isFirstMonth)
      : true

    // Billing parameters
    const params: string[][] = [
      ["Billing Parameters"],
      ["Semester", selectedSemester.name],
      isMonthView ? ["Selected Months", selectedMonthsInfo.map(m => m.label).join(", ")] : [],
      ["From Date", startDate.toLocaleDateString()],
      ["To Date", endDate.toLocaleDateString()],
      ["Total Days", totalDays.toString()],
      ["Labor Charge (per day)", semLaborCharge.toString()],
      ["Provision Charge (per day)", semProvisionCharge.toString()],
      !isMonthView ? ["Advance Amount", semAdvanceAmount.toString()] : [],
      [""], // Empty row
      ["Student Billing Data"],
    ].filter(row => row.length > 0)

    // Header row based on view mode
    const headerRow = isMonthView
      ? (includesFirstMonth
        ? ["Student", "Roll No", "Dept", "Hostel", "Labour Mandays", "Provision Mandays", "Labor Charge", "Provision Charges", "Carry Forward", "Advance Paid", "Balance Amount"]
        : ["Student", "Roll No", "Dept", "Hostel", "Labour Mandays", "Provision Mandays", "Labor Charge", "Provision Charges", "Carry Forward", "Balance Amount"])
      : ["Student", "Roll No", "Dept", "Hostel", "Labour Mandays", "Provision Mandays", "Labor Charge", "Provision Charges", "Carry Forward", "Advance Amount to Pay", "Advance Paid", "Balance Amount"]

    params.push(headerRow)

    // Student data
    dataSource.forEach(student => {
      const row = isMonthView
        ? (includesFirstMonth
          ? [
            student.name,
            `\t${student.rollNo}`,
            student.dept || "Not Set",
            student.hostel,
            student.labourMandays.toString(),
            student.provisionMandays.toString(),
            student.laborCharge.toFixed(2),
            student.provisionCharge.toFixed(2),
            student.carryForwardAmount.toFixed(2),
            student.advancePaid.toFixed(2),
            student.totalAmount.toFixed(2)
          ]
          : [
            student.name,
            `\t${student.rollNo}`,
            student.dept || "Not Set",
            student.hostel,
            student.labourMandays.toString(),
            student.provisionMandays.toString(),
            student.laborCharge.toFixed(2),
            student.provisionCharge.toFixed(2),
            student.carryForwardAmount.toFixed(2),
            student.totalAmount.toFixed(2)
          ])
        : [
          student.name,
          `\t${student.rollNo}`,
          student.dept || "Not Set",
          student.hostel,
          student.labourMandays.toString(),
          student.provisionMandays.toString(),
          student.laborCharge.toFixed(2),
          student.provisionCharge.toFixed(2),
          student.carryForwardAmount.toFixed(2),
          student.advanceAmountToPay.toFixed(2),
          student.advancePaid.toFixed(2),
          student.totalAmount.toFixed(2)
        ]
      params.push(row)
    })

    // Convert to CSV
    const csvContent = params.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

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

    // Exclude Mando students from billing (they have separate billing in mando-students page)
    const isNotMando = !student.isMando

    return matchesSearch && matchesHostel && matchesYear && matchesStatus && matchesDept && isNotMando
  })

  const fetchSemStudentsData = async (semesterOverride?: Semester | null, overrideLaborRate?: number, overrideProvisionCharge?: number) => {
    const targetSemester = semesterOverride || selectedSemester

    // Validate if this request is for the currently active semester
    if (targetSemester && targetSemester.id.toString() !== activeSemesterIdRef.current) {
      console.log("[DEBUG] Skipping stale fetch request for semester:", targetSemester.id)
      return
    }

    if (!targetSemester) {
      setStudentsSem([])
      setLoadingStudentsSem(false)
      return
    }

    setLoadingStudentsSem(true)
    try {
      const startDate = new Date(targetSemester.startDate)
      const endDate = new Date(targetSemester.endDate)

      // Get all semesters once for carry forward calculations
      const allSemestersResponse = await fetch('/api/semesters')
      if (!allSemestersResponse.ok) {
        throw new Error("Failed to fetch semesters")
      }
      const allSemesters = await allSemestersResponse.json()

      // Find the semester that ended just before the current semester started
      const currentSemesterStart = new Date(targetSemester.startDate)
      let previousSemester = null
      let smallestTimeDiff = Infinity

      for (const semester of allSemesters) {
        if (semester.id !== targetSemester.id) {
          const semesterEnd = new Date(semester.endDate)
          const timeDiff = currentSemesterStart.getTime() - semesterEnd.getTime()

          // Find semester that ended before current semester started, with smallest time difference
          if (timeDiff > 0 && timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff
            previousSemester = semester
          }
        }
      }

      // Get previous semester fee records if found
      let prevFeeRecords = []
      if (previousSemester) {
        try {
          console.log(`[DEBUG] Found previous semester: ${previousSemester.name} (ended ${previousSemester.endDate})`)
          const prevFeeRecordsResponse = await fetch(`/api/fee-records?semesterId=${previousSemester.id}`)
          if (prevFeeRecordsResponse.ok) {
            prevFeeRecords = await prevFeeRecordsResponse.json()
            console.log(`[DEBUG] Found ${prevFeeRecords.length} fee records from previous semester`)
          }
        } catch (error) {
          console.error("Error fetching previous semester fee records:", error)
        }
      } else {
        console.log("[DEBUG] No previous semester found for carry forward")
      }

      // Get all students
      const studentsResponse = await fetch('/api/students')
      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students")
      }
      const students = await studentsResponse.json()

      // Get fee records for the selected semester
      const feeRecordsResponse = await fetch(`/api/fee-records?semesterId=${targetSemester.id}`)
      if (!feeRecordsResponse.ok) {
        throw new Error("Failed to fetch fee records")
      }
      const feeRecords = await feeRecordsResponse.json()

      // Final check: if user switched semester while we were fetching
      if (targetSemester.id.toString() !== activeSemesterIdRef.current) {
        console.log("[DEBUG] User switched semester during fetch, abandoning student data update")
        setLoadingStudentsSem(false)
        return
      }

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

        // Calculate labour mandays (P + L + CN)
        const labourMandays = attendanceRecords.filter((att: { code: AttendanceCode; date: Date }) =>
          att.code === AttendanceCode.P ||
          att.code === AttendanceCode.L ||
          att.code === AttendanceCode.CN
        ).length

        // Filter out vacated students with 0 mandays (no attendance in this period)
        if (student.status === "VACATE" && labourMandays === 0) {
          continue
        }

        // Calculate provision mandays (P + L)
        const provisionMandays = attendanceRecords.filter((att: { code: AttendanceCode; date: Date }) =>
          att.code === AttendanceCode.P ||
          att.code === AttendanceCode.L
        ).length

        // Get actual paid amount from fee records
        const studentFeeRecord = feeRecords.find((record: any) => record.studentId === student.id)
        const advancePaid = studentFeeRecord ? studentFeeRecord.amountPaid : 0
        const feeRecordId = studentFeeRecord ? studentFeeRecord.id : undefined

        // Calculate carry forward from previous semester
        let carryForwardAmount = 0
        if (previousSemester) {
          const prevRecord = prevFeeRecords.find((record: any) => record.studentId === student.id)
          if (prevRecord && prevRecord.balance !== undefined) {
            const prevBalance = prevRecord.balance
            // If previous balance was negative (student owes money), carry forward is positive (add to next semester dues)
            // If previous balance was positive (student has credit), carry forward is negative (reduce next semester dues)
            carryForwardAmount = -prevBalance
          }
        }

        // Get the base amount for this semester
        const semesterBaseAmount = targetSemester?.feeStructures[0]?.baseAmount || 0

        // Use override if provided, otherwise fallback to state or 0. Ensure it's a number.
        const provisionChargeToUse = (typeof overrideProvisionCharge === 'number' && !isNaN(overrideProvisionCharge))
          ? overrideProvisionCharge
          : (typeof semProvisionCharge === 'number' && !isNaN(semProvisionCharge) ? semProvisionCharge : 0)

        const laborRateToUse = (typeof overrideLaborRate === 'number' && !isNaN(overrideLaborRate))
          ? overrideLaborRate
          : semLaborCharge

        const laborCharge = labourMandays * laborRateToUse
        const provisionCharge = provisionChargeToUse * provisionMandays
        const advanceAmountToPay = semesterBaseAmount + carryForwardAmount

        // Balance Amount calculation: if advance not paid, subtract the full advance amount to pay
        const totalAmount = advancePaid === 0
          ? advancePaid - advanceAmountToPay - (laborCharge + provisionCharge)
          : advancePaid - (laborCharge + provisionCharge)

        studentsData.push({
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          dept: student.dept,
          hostel: student.hostel?.name || 'Unknown',
          year: student.year,
          status: student.status,
          isMando: student.isMando,
          labourMandays,
          provisionMandays,
          laborCharge,
          provisionCharge,
          advancePaid,
          carryForwardAmount,
          totalAmount,
          advanceAmountToPay,
          feeRecordId,
        })
      }

      setStudentsSem(studentsData)
    } catch (error) {
      console.error("Error fetching sem students data:", error)
    } finally {
      setLoadingStudentsSem(false)
    }
  }

  // Fetch student billing data for selected months (Month View)
  // Implements automatic carry forward calculation from previous months
  const fetchMonthStudentsData = async () => {
    if (!selectedSemester) {
      setMonthStudentsData([])
      return
    }

    // CRITICAL: Compute months directly from selectedSemester to avoid stale state issues
    // This duplicates getMonthsInSemester logic but ensures we use fresh semester data
    const computeMonthsForSemester = (semester: Semester) => {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
      const computedMonths: Array<{
        value: string; label: string; year: number; month: number;
        startDate: Date; endDate: Date; isFirstMonth: boolean; isLastMonth: boolean;
      }> = []

      const semesterStart = new Date(semester.startDate)
      const semesterEnd = new Date(semester.endDate)
      let currentDate = new Date(semesterStart.getFullYear(), semesterStart.getMonth(), 1)
      let isFirst = true

      while (currentDate <= semesterEnd) {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)
        const isLast = (year === semesterEnd.getFullYear() && month === semesterEnd.getMonth())

        // Conflict resolution: Check if another semester owns this month
        const overlapStart = new Date(Math.max(monthStart.getTime(), semesterStart.getTime()))
        const overlapEnd = new Date(Math.min(monthEnd.getTime(), semesterEnd.getTime()))
        let myOverlapDays = 0
        if (overlapEnd >= overlapStart) {
          myOverlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }

        let belongsToOther = false
        if (semesters && semesters.length > 0) {
          for (const otherSem of semesters) {
            if (otherSem.id === semester.id) continue
            const otherSemStart = new Date(otherSem.startDate)
            const otherSemEnd = new Date(otherSem.endDate)
            const otherOverlapStart = new Date(Math.max(monthStart.getTime(), otherSemStart.getTime()))
            const otherOverlapEnd = new Date(Math.min(monthEnd.getTime(), otherSemEnd.getTime()))
            if (otherOverlapEnd >= otherOverlapStart) {
              const otherOverlapDays = Math.ceil((otherOverlapEnd.getTime() - otherOverlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
              if (otherOverlapDays > myOverlapDays) {
                belongsToOther = true
                break
              }
            }
          }
        }

        if (!belongsToOther) {
          computedMonths.push({
            value: `${year}-${String(month + 1).padStart(2, '0')}`,
            label: `${monthNames[month]} ${year}`,
            year, month: month + 1,
            startDate: monthStart, endDate: monthEnd,
            isFirstMonth: isFirst, isLastMonth: isLast,
          })
          isFirst = false
        }
        currentDate = new Date(year, month + 1, 1)
      }
      return computedMonths
    }

    const freshMonths = computeMonthsForSemester(selectedSemester)
    const allMonthsSorted = [...freshMonths].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    if (allMonthsSorted.length === 0) {
      setMonthStudentsData([])
      return
    }

    // Use selectedMonths if valid, otherwise return (user must select manually)
    const validSelectedMonths = Array.from(selectedMonths).filter(m =>
      allMonthsSorted.some(am => am.value === m)
    )
    if (validSelectedMonths.length === 0) {
      console.log("[DEBUG] No valid months selected - waiting for user to select")
      setMonthStudentsData([])
      return
    }
    const monthsToFetch = new Set(validSelectedMonths)

    const selectedMonthsInfo = allMonthsSorted.filter(m => monthsToFetch.has(m.value))

    // Capture the semester ID at the start of this fetch to detect if it changes mid-flight
    const fetchSemesterId = selectedSemester.id

    console.log(`[DEBUG] fetchMonthStudentsData - Semester: ${selectedSemester.name} (ID: ${fetchSemesterId}), Months: ${selectedMonthsInfo.map(m => m.label).join(', ')}`)

    if (selectedMonthsInfo.length === 0) {
      setMonthStudentsData([])
      return
    }

    setLoadingMonthData(true)
    try {
      // Stale-check helper
      const isStale = () => selectedSemester.id !== fetchSemesterId || activeSemesterIdRef.current !== fetchSemesterId.toString()
      const timestamp = Date.now() // For cache-busting

      // Helper function for date formatting
      const formatDateForApi = (date: Date) => {
        const year = date.getFullYear()
        const monthNum = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${monthNum}-${day}`
      }

      // Calculate total days in selected months
      const totalSelectedDays = selectedMonthsInfo.reduce((sum, m) =>
        sum + Math.ceil((m.endDate.getTime() - m.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        , 0)

      // Calculate provision rate for selected months (same as fetchMonthProvisionCosts)
      let calculatedProvisionCost = 0
      let calculatedMandoDeduction = 0

      for (const month of selectedMonthsInfo) {
        const monthStartDate = formatDateForApi(month.startDate)
        const monthEndDate = formatDateForApi(month.endDate)

        // Fetch provision
        try {
          const provisionUrl = `/api/provision-usage?startDate=${monthStartDate}&endDate=${monthEndDate}`
          const provisionRes = await fetch(provisionUrl)
          if (provisionRes.ok) {
            const provisionData = await provisionRes.json()
            const monthCost = provisionData.reduce((sum: number, record: any) => {
              const quantity = parseFloat(record.quantity || 0)
              const unitCost = parseFloat(record.provisionItem?.unitCost || 0)
              return sum + (quantity * unitCost)
            }, 0)
            calculatedProvisionCost += monthCost
          }
        } catch (err) {
          console.error("Error fetching provision:", err)
        }

        // Fetch mando
        try {
          const mandoUrl = `/api/mando-meal-records?startDate=${monthStartDate}&endDate=${monthEndDate}`
          const mandoRes = await fetch(mandoUrl)
          if (mandoRes.ok) {
            const mandoRecords = await mandoRes.json()
            const monthMandoCost = mandoRecords.reduce((sum: number, record: any) => {
              const mealsCount = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0)
              return sum + (mealsCount * Number(record.mealRate || 50))
            }, 0)
            calculatedMandoDeduction += monthMandoCost
          }
        } catch (err) {
          console.error("Error fetching mando:", err)
        }
      }

      const netProvisionCost = Math.max(0, calculatedProvisionCost - calculatedMandoDeduction)
      const calculatedProvisionPerDay = totalSelectedDays > 0 ? netProvisionCost / totalSelectedDays : 0
      const calculatedLaborPerDay = semLaborCharge // Labor rate stays same as semester

      console.log("[DEBUG] fetchMonthStudentsData - Provision per day:", calculatedProvisionPerDay, "Labor per day:", calculatedLaborPerDay)

      // Get all students (with cache-busting)
      const studentsResponse = await fetch(`/api/students?t=${timestamp}`)
      if (!studentsResponse.ok) throw new Error("Failed to fetch students")
      const students = await studentsResponse.json()

      // Stale check before proceeding
      if (isStale()) {
        console.log("[DEBUG] Fetch aborted - semester changed during fetch")
        return
      }

      // Get fee records for the selected semester (for advance paid)
      const feeRecordsResponse = await fetch(`/api/fee-records?semesterId=${fetchSemesterId}&t=${timestamp}`)
      if (!feeRecordsResponse.ok) throw new Error("Failed to fetch fee records")
      const semesterFeeRecords = await feeRecordsResponse.json()

      // Get all attendance
      const attendanceResponse = await fetch('/api/attendance')
      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance")
      const allAttendance = await attendanceResponse.json()

      // Get previous semester OR previous month carry forward
      let prevMonthBalances: any[] = []
      let prevSemesterFeeRecords: any[] = []

      if (allMonthsSorted[0]?.isFirstMonth) {
        // Calculate the month/year immediately preceding the FIRST AVAILABLE month (not semester start)
        // This handles cases where months were reassigned due to conflict resolution
        const firstAvailableMonth = allMonthsSorted[0]
        const prevDate = new Date(firstAvailableMonth.startDate)
        prevDate.setDate(0) // Last day of previous month

        const prevMonth = prevDate.getMonth() + 1
        const prevYear = prevDate.getFullYear()

        console.log(`[DEBUG] First available month: ${firstAvailableMonth.label}. Checking for carry forward from: ${prevMonth}/${prevYear}`)

        // Fetch saved monthly balance for that specific month/year
        // We use the general monthly-balances API but filter by month/year only
        // The API currently filters by semesterId - we might need to adjust API or just iterate semesters?
        // Actually, the API filters by 'semesterId' OR 'month/year' if supported. 
        // Let's modify the filtering logic in the component or rely on a new fetch pattern.
        // Wait, current API requires semesterId or takes it as filter?
        // Let's check /api/monthly-balances?month=X&year=Y

        try {
          // We need to find which semester that month belonged to, OR fetch all for that month/year
          // Simplest: Fetch for that month/year regardless of semester
          const prevMonthBalRes = await fetch(`/api/monthly-balances?month=${prevMonth}&year=${prevYear}`)
          if (prevMonthBalRes.ok) {
            prevMonthBalances = await prevMonthBalRes.json()
            console.log(`[DEBUG] Found ${prevMonthBalances.length} saved balances from ${prevMonth}/${prevYear}`)
          }
        } catch (err) {
          console.error("Error fetching previous month balances:", err)
        }

        // Fallback: If no monthly balance found, valid fallback is PREVIOUS SEMESTER ENDING BALANCE (Fee Records)
        if (prevMonthBalances.length === 0) {
          // ... (existing logic to fetch previous semester fee records) ...
          const allSemestersResponse = await fetch('/api/semesters')
          if (allSemestersResponse.ok) {
            const allSemesters = await allSemestersResponse.json()
            const currentSemesterStart = new Date(selectedSemester.startDate)
            let previousSemester = null
            let smallestTimeDiff = Infinity

            for (const semester of allSemesters) {
              if (semester.id !== selectedSemester.id) {
                const semesterEnd = new Date(semester.endDate)
                const timeDiff = currentSemesterStart.getTime() - semesterEnd.getTime()
                if (timeDiff > 0 && timeDiff < smallestTimeDiff) {
                  smallestTimeDiff = timeDiff
                  previousSemester = semester
                }
              }
            }

            if (previousSemester) {
              const prevFeeRecordsResponse = await fetch(`/api/fee-records?semesterId=${previousSemester.id}`)
              if (prevFeeRecordsResponse.ok) {
                // Transform these into a shape similar to MonthlyBalance for uniform usage?
                // Or keep separate. Let's keep separate variable for clarity.
                prevSemesterFeeRecords = await prevFeeRecordsResponse.json()
                console.log(`[DEBUG] Using Semester End Balance from: ${previousSemester.name}`)
              }
            }
          }
        }
      }

      // Fetch saved monthly balances for this semester (for carry forward between months)
      let savedMonthlyBalances: any[] = []
      try {
        const monthlyBalancesResponse = await fetch(`/api/monthly-balances?semesterId=${selectedSemester.id}`)
        if (monthlyBalancesResponse.ok) {
          savedMonthlyBalances = await monthlyBalancesResponse.json()
          console.log("[DEBUG] Fetched saved monthly balances:", savedMonthlyBalances.length)
        }
      } catch (err) {
        console.error("Error fetching saved monthly balances:", err)
      }

      // Fetch saved monthly rates (labor/provision)
      let savedMonthlyRates: any[] = []
      try {
        // Fetch saved monthly rates (labor/provision)
        let savedMonthlyRates: any[] = []
        try {
          // Fetch ALL rates for the selected months (we can filter locally or by date range if API supports, 
          // but simplest is to just fetch by semester ID OR just fetch all for now since we need to match by Month/Year)
          // Actually, previous logic fetched by semesterId, which isolated them.
          // We want to fetch by Month/Year. Since we have multiple months, we can't easily pass array.
          // Option 1: Iterate and fetch (slow).
          // Option 2: Remove semesterId filter here? No the API filters if param is present.
          // If we don't pass semesterId, we get ALL rates? 
          // Let's modify the fetch to be more specific if possible or just fetch all for this semester context 
          // BUT wait, if we want cross-semester, we can't filter by semesterId.

          // Strategy: Iterate selected months and fetch individually? Or fetch all monthly rates and filter locally?
          // Fetching all might be too much.
          // Let's iterate linearly since selectedMonths is usually small (1-6 months).

          // Actually, better path:
          // We want rates for specific Month/Years.
          // Let's keep it simple: Fetch by semesterId IS problematic.
          // Let's loop for now (parallel promises).

          const ratePromises = allMonthsSorted.map(async (month) => {
            const res = await fetch(`/api/monthly-rates?month=${month.month}&year=${month.year}&t=${Date.now()}`, { cache: 'no-store' })
            if (res.ok) {
              const data = await res.json()
              if (data.length > 0) return data[0] // Return the first matching rate (global logic)
            }
            return null
          })

          const results = await Promise.all(ratePromises)
          savedMonthlyRates = results.filter(r => r !== null)

        } catch (err) {
          console.error("Error fetching saved monthly rates:", err)
        }
      } catch (err) {
        console.error("Error fetching saved monthly rates:", err)
      }

      const studentsData: StudentBillingData[] = []
      const semesterBaseAmount = selectedSemester?.feeStructures[0]?.baseAmount || 0

      for (const student of students) {
        // Skip mando students in billing
        if (student.isMando) continue

        // Track running balance through all months in semester
        let runningBalance = 0

        // For first month: get previous semester carry forward
        // For first month: get previous semester carry forward OR previous month balance
        if (allMonthsSorted[0]?.isFirstMonth) {
          // Priority 1: Check for explicit monthly balance from previous month
          if (prevMonthBalances.length > 0) {
            const prevMonthRec = prevMonthBalances.find((r: any) => r.studentId === student.id)
            if (prevMonthRec) {
              runningBalance = parseFloat(prevMonthRec.balance)
            } else if (prevSemesterFeeRecords.length > 0) {
              // Fallback to semester balance if specific month balance not found (e.g. absent that month?)
              // Or maybe strict? Let's fallback to be safe.
              const prevRecord = prevSemesterFeeRecords.find((record: any) => record.studentId === student.id)
              if (prevRecord && prevRecord.balance !== undefined) {
                runningBalance = prevRecord.balance
              }
            }
          }
          // Priority 2: Fallback to Semester Fee Record (Legacy/Standard)
          else if (prevSemesterFeeRecords.length > 0) {
            const prevRecord = prevSemesterFeeRecords.find((record: any) => record.studentId === student.id)
            if (prevRecord && prevRecord.balance !== undefined) {
              runningBalance = prevRecord.balance // Previous semester's ending balance
            }
          }
        }

        // Get student's advance paid from fee records
        const studentFeeRecord = semesterFeeRecords.find((record: any) => record.studentId === student.id)
        const advancePaidFromRecord = studentFeeRecord ? studentFeeRecord.amountPaid : 0

        // Aggregated values for selected months
        let totalLabourMandays = 0
        let totalProvisionMandays = 0
        let totalLaborCharge = 0
        let totalProvisionCharge = 0
        let displayAdvancePaid = 0
        let carryForwardForDisplay = 0
        let isFirstSelectedMonth = true
        let hasAnyAttendance = false

        // Calculate each month in the semester (for proper carry forward chain)
        for (const month of allMonthsSorted) {
          // Filter attendance for this specific month
          const monthAttendance = allAttendance.filter((att: any) => {
            const attDate = new Date(att.date)
            return att.studentId === student.id &&
              attDate >= month.startDate &&
              attDate <= month.endDate
          })

          const attendanceRecords = monthAttendance.map((att: any) => ({
            code: att.code as AttendanceCode,
            date: new Date(att.date),
          }))

          // Calculate labour mandays (P + L + CN)
          const labourMandays = attendanceRecords.filter((att: { code: AttendanceCode }) =>
            att.code === AttendanceCode.P ||
            att.code === AttendanceCode.L ||
            att.code === AttendanceCode.CN
          ).length

          // Calculate provision mandays (P + L)
          const provisionMandays = attendanceRecords.filter((att: { code: AttendanceCode }) =>
            att.code === AttendanceCode.P ||
            att.code === AttendanceCode.L
          ).length

          // Use monthly rate if available, otherwise semester rate
          // If a manual override was passed to the function (unlikely in this context but good to keep), use that.
          let laborRateToUse = calculatedLaborPerDay
          let provisionRateToUse = calculatedProvisionPerDay

          const savedRate = savedMonthlyRates.find(
            (mr: any) => mr.month === month.month && mr.year === month.year
          )

          if (savedRate) {
            laborRateToUse = parseFloat(savedRate.laborRate)
            if (savedRate.provisionRate) {
              provisionRateToUse = parseFloat(savedRate.provisionRate)
            }
          }

          const laborCharge = labourMandays * laborRateToUse
          const provisionCharge = provisionMandays * provisionRateToUse

          // Check if there's a saved balance from the previous month
          const monthIndex = allMonthsSorted.indexOf(month)
          if (monthIndex > 0) {
            const prevMonth = allMonthsSorted[monthIndex - 1]
            const savedPrevBalance = savedMonthlyBalances.find(
              (sb: any) => sb.studentId === student.id &&
                sb.month === prevMonth.month &&
                sb.year === prevMonth.year
            )
            if (savedPrevBalance) {
              // Use saved balance instead of calculated running balance
              runningBalance = parseFloat(savedPrevBalance.balance)
              console.log(`[DEBUG] Using saved balance for ${student.name}, ${prevMonth.label}: ${runningBalance}`)
            }
          }

          // Calculate this month's balance
          let monthBalance: number
          if (month.isFirstMonth) {
            // First month: Advance paid - costs 
            // (carry forward from prev semester is already in runningBalance)
            if (advancePaidFromRecord === 0) {
              // No payment made yet: balance = -(what's due) - costs
              const advanceToPayWithCarry = semesterBaseAmount - runningBalance
              monthBalance = 0 - advanceToPayWithCarry - (laborCharge + provisionCharge)
            } else {
              // Payment made: balance = what was paid - costs + any previous carry forward
              monthBalance = advancePaidFromRecord + runningBalance - (laborCharge + provisionCharge)
            }
            // Debug first month calculation
            if (selectedMonths.has(month.value)) {
              console.log(`[DEBUG] First month calc for ${student.name}:`, {
                advancePaidFromRecord,
                runningBalance,
                laborCharge,
                provisionCharge,
                monthBalance
              })
            }
          } else {
            // Subsequent months: Previous balance - this month's costs
            monthBalance = runningBalance - (laborCharge + provisionCharge)
          }

          // If this month is in our selected months, aggregate its data
          if (selectedMonths.has(month.value)) {
            if (labourMandays > 0 || provisionMandays > 0) {
              hasAnyAttendance = true
            }

            if (isFirstSelectedMonth) {
              // Carry forward for the first selected month is the running balance BEFORE this month
              // Positive balance = credit (remaining), Negative balance = debt (used extra)
              carryForwardForDisplay = runningBalance
              displayAdvancePaid = month.isFirstMonth ? advancePaidFromRecord : 0
              isFirstSelectedMonth = false
            }

            totalLabourMandays += labourMandays
            totalProvisionMandays += provisionMandays
            totalLaborCharge += laborCharge
            totalProvisionCharge += provisionCharge
          }

          // Update running balance for next month
          runningBalance = monthBalance
        }

        // Filter out vacated students with no attendance in selected months
        if (student.status === "VACATE" && !hasAnyAttendance) continue

        // Final balance is based on selected months only, not all months
        // Calculate: advancePaid - totalCosts (for first selected month being first of semester)
        // Or: carryForward - totalCosts (for subsequent months)
        let finalBalance: number
        if (selectedMonthsInfo[0]?.isFirstMonth) {
          // First month of semester selected
          const studentFeeRecord = semesterFeeRecords.find((record: any) => record.studentId === student.id)
          const advPaid = studentFeeRecord ? studentFeeRecord.amountPaid : 0
          finalBalance = advPaid - totalLaborCharge - totalProvisionCharge
        } else {
          // Later months - use carry forward (positive is credit, negative is debt) minus costs
          finalBalance = carryForwardForDisplay - totalLaborCharge - totalProvisionCharge
        }

        studentsData.push({
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          dept: student.dept,
          hostel: student.hostel?.name || 'Unknown',
          year: student.year,
          status: student.status,
          isMando: student.isMando,
          labourMandays: totalLabourMandays,
          provisionMandays: totalProvisionMandays,
          laborCharge: totalLaborCharge,
          provisionCharge: totalProvisionCharge,
          advancePaid: displayAdvancePaid,
          carryForwardAmount: carryForwardForDisplay,
          totalAmount: finalBalance,
          advanceAmountToPay: selectedMonthsInfo[0]?.isFirstMonth ? semesterBaseAmount + carryForwardForDisplay : 0,
          feeRecordId: studentFeeRecord?.id,
        })
      }

      // Final stale check before setting result
      if (isStale()) {
        console.log("[DEBUG] Fetch completed but semester changed - discarding result")
        return
      }

      console.log(`[DEBUG] Setting monthStudentsData with ${studentsData.length} students for semester ID ${fetchSemesterId}`)
      setMonthStudentsData(studentsData)
    } catch (error) {
      console.error("Error fetching month students data:", error)
    } finally {
      setLoadingMonthData(false)
    }
  }

  // Trigger month provision fetch when selected months change OR semester changes in month view
  useEffect(() => {
    if (viewMode === 'month' && selectedMonths.size > 0 && selectedSemester) {
      fetchMonthProvisionCosts()
    }
  }, [viewMode, selectedMonths, availableMonths, selectedSemester])

  // Trigger month data fetch when provision costs are calculated OR semester changes
  // CRITICAL: Must depend on availableMonths to ensure we wait for month computation to complete
  useEffect(() => {
    if (viewMode === 'month' && selectedMonths.size > 0 && !loadingMonthProvision && selectedSemester && availableMonths.length > 0) {
      // Additional validation: ensure selectedMonths are valid for current availableMonths
      const validMonths = Array.from(selectedMonths).filter(m =>
        availableMonths.some(am => am.value === m)
      )
      if (validMonths.length > 0) {
        fetchMonthStudentsData()
      } else {
        console.log("[DEBUG] Skipping fetch - selectedMonths not valid for current availableMonths")
      }
    }
  }, [viewMode, selectedMonths, monthLaborPerDay, monthProvisionPerDay, selectedSemester, availableMonths])

  // Trigger semester rate fetch when switching to Semester View
  useEffect(() => {
    if (viewMode === 'semester' && selectedSemester) {
      console.log("[DEBUG] Switched to Semester View, refreshing rates")
      fetchSemesterLaborRate(selectedSemester).then(savedRate => {
        if (savedRate !== null) {
          setSemLaborCharge(savedRate)
          if (totalSemesterDays > 0) {
            const calculated = (savedRate * totalSemesterDays).toFixed(2)
            setOverallLaborCharge(calculated.endsWith('.00') ? calculated.slice(0, -3) : calculated)
          }
        }
      })
    }
  }, [viewMode, selectedSemester]) // Depend on selectedSemester too just in case


  useEffect(() => {
    fetchSemesters()
  }, [])

  // Force refresh data when semester changes
  useEffect(() => {
    console.log("[DEBUG] useEffect triggered - selectedSemester:", selectedSemester ? selectedSemester.name : "null")
    if (selectedSemester) {
      console.log("[DEBUG] selectedSemester changed, triggering force refresh:", selectedSemester.name, "ID:", selectedSemester.id)
      // Use setTimeout to ensure all state updates have completed
      const timeoutId = setTimeout(() => {
        console.log("[DEBUG] Executing force refresh for:", selectedSemester.name)
        forceRefetchSemesterData(selectedSemester)
      }, 300) // Longer delay to ensure state settlement

      return () => {
        console.log("[DEBUG] Clearing timeout for previous semester change")
        clearTimeout(timeoutId)
      }
    } else {
      console.log("[DEBUG] No selected semester, skipping force refresh")
    }
  }, [selectedSemester])

  // Update overall labor charge when semLaborCharge or totalSemesterDays changes
  useEffect(() => {
    // This effect handles updates to overall charge display when underlying Per Day rate changes
    // But we need to be careful not to create loops or overwrite user input while typing
    if (totalSemesterDays > 0 && semLaborCharge > 0) {
      const calculatedOverall = (semLaborCharge * totalSemesterDays).toFixed(2)
      // Only set if significant difference to avoid fighting with rounding
      // For now, we'll leave this as one-way from Per Day -> Overall is primarily for display if changed elsewhere
    }
  }, [semLaborCharge, totalSemesterDays])

  // Initialize overall charge when semester is selected and totally calculated
  useEffect(() => {
    if (selectedSemester && totalSemesterDays > 0) {
      const calculated = (semLaborCharge * totalSemesterDays).toFixed(2)
      setOverallLaborCharge(calculated.endsWith('.00') ? calculated.slice(0, -3) : calculated)
    }
  }, [selectedSemester, totalSemesterDays])

  // Handle overall labor charge change
  const handleOverallLaborChargeChange = (value: string) => {
    setOverallLaborCharge(value)
    const amount = parseFloat(value)

    if (viewMode === 'month' && selectedMonths.size > 0) {
      if (!isNaN(amount) && monthTotalDays > 0) {
        const perDay = amount / monthTotalDays
        setMonthLaborPerDay(perDay)
      } else {
        setMonthLaborPerDay(0)
      }
    } else {
      if (!isNaN(amount) && totalSemesterDays > 0) {
        const perDay = amount / totalSemesterDays
        setSemLaborCharge(perDay)
      } else {
        setSemLaborCharge(0)
      }
    }
  }

  // Removed the useEffect that was causing conflicts - now handled in handleSemesterChange

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Unified Page Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Billing Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage student labor, provision, and monthly billing</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="inline-flex items-center p-1 bg-muted/50 rounded-lg border border-border/60 shadow-sm h-10">
            <button
              onClick={() => setViewMode('semester')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${viewMode === 'semester'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              Semester View
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${viewMode === 'month'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              Month View
            </button>
          </div>

          <Button variant="outline" onClick={exportToCSV} size="sm" className="h-10 border-primary/20 hover:bg-primary/5 text-primary">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Compact Semester Selection Toolbar */}
      <div className="bg-card border rounded-lg shadow-sm p-4 flex flex-col items-start gap-4 animate-in fade-in slide-in-from-top-1">
        <div className="w-full flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-[280px]">
              {loadingSemesters ? (
                <div className="flex items-center justify-center h-10 border border-input rounded-md bg-background px-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <Select value={selectedSemesterId} onValueChange={handleSemesterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(semester => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create-new" className="text-primary font-medium focus:text-primary border-t mt-1">
                      + Create New Semester
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedSemester && (
              <div className="hidden md:flex items-center gap-3 text-sm border-l pl-4">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Active</Badge>
                <div className="font-medium text-foreground">{selectedSemester.name}</div>
                <div className="text-muted-foreground">
                  {new Date(selectedSemester.startDate).toLocaleDateString()} - {new Date(selectedSemester.endDate).toLocaleDateString()}
                </div>
                <div className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  Base: ₹{selectedSemester.feeStructures[0]?.baseAmount || 0}
                </div>
              </div>
            )}
          </div>

          {selectedSemester && (
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editSemester(selectedSemester)}
                className="h-9 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSemester(selectedSemester.id, selectedSemester.name)}
                className="h-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Mobile details view */}
        {selectedSemester && (
          <div className="flex md:hidden flex-wrap items-center gap-2 text-xs text-muted-foreground w-full pt-2 border-t mt-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 scale-90 origin-left">Active</Badge>
            <span>{new Date(selectedSemester.startDate).toLocaleDateString()} - {new Date(selectedSemester.endDate).toLocaleDateString()}</span>
            <span className="ml-auto font-medium">Base: ₹{selectedSemester.feeStructures[0]?.baseAmount || 0}</span>
          </div>
        )}

        {/* Create/Edit Semester Form */}
        {showCreateSemester && (
          <div className="w-full mt-2 pt-4 border-t animate-in slide-in-from-top-2">
            <h3 className="text-sm font-semibold mb-3">{editingSemesterId ? 'Edit Semester' : 'Create New Semester'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g. Sem 1"
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Base Amount</Label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={newSemesterBaseAmount}
                  onChange={(e) => setNewSemesterBaseAmount(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <DatePicker
                  date={newSemesterStartDate ? new Date(newSemesterStartDate) : undefined}
                  setDate={(date) => date ? setNewSemesterStartDate(date.toISOString().split('T')[0]) : setNewSemesterStartDate("")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <DatePicker
                  date={newSemesterEndDate ? new Date(newSemesterEndDate) : undefined}
                  setDate={(date) => date ? setNewSemesterEndDate(date.toISOString().split('T')[0]) : setNewSemesterEndDate("")}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateSemester(false)}>Cancel</Button>
              <Button size="sm" onClick={editingSemesterId ? updateSemester : createNewSemester} disabled={creatingSemester}>
                {creatingSemester ? "Saving..." : (editingSemesterId ? "Update" : "Create")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Compact Month Selection - Only visible in Month View */}
      {viewMode === 'month' && selectedSemester && availableMonths.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">Select Month:</span>
            {selectedMonths.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMonths(new Set())}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Selection
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {availableMonths.map((month) => {
              const isSelected = selectedMonths.has(month.value)
              const daysInMonth = Math.ceil((month.endDate.getTime() - month.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              return (
                <button
                  key={month.value}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMonths(new Set())
                      setMonthSelectionError(null)
                    } else {
                      const newSelection = new Set<string>()
                      newSelection.add(month.value)
                      setSelectedMonths(newSelection)
                      setMonthSelectionError(null)
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }
                  `}
                >
                  <span>{month.label}</span>
                  <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'opacity-60'}`}>({daysInMonth}d)</span>
                </button>
              )
            })}
          </div>

          {monthSelectionError && (
            <div className="text-xs text-red-500 font-medium animate-in fade-in">
              ⚠ {monthSelectionError}
            </div>
          )}
        </div>
      )}

      {/* Billing Parameters */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Billing Parameters
              {viewMode === 'month' && selectedMonths.size > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (for {selectedMonths.size} selected month{selectedMonths.size > 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
            {viewMode === 'month' && selectedMonths.size > 0 && (
              <span className="text-xs text-primary font-medium">
                {(() => {
                  const selectedMonthsInfo = availableMonths.filter(m => selectedMonths.has(m.value))
                  const totalDays = selectedMonthsInfo.reduce((sum, m) =>
                    sum + Math.ceil((m.endDate.getTime() - m.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                    , 0)
                  return `${totalDays} days total`
                })()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="overallLabor" className="text-xs text-muted-foreground">Total Labor Cost</Label>
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    id="overallLabor"
                    type="number"
                    step="1"
                    className={`h-8 ${loadingProvisionCharge ? 'bg-primary/5 border-primary/30 text-transparent' : ''}`}
                    value={overallLaborCharge}
                    onChange={(e) => handleOverallLaborChargeChange(e.target.value)}
                    placeholder="Enter total amount"
                    disabled={loadingProvisionCharge}
                  />
                  {loadingProvisionCharge && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="semLabor" className="text-xs text-muted-foreground">Labor Charge / day</Label>
                <span className="text-[10px] text-muted-foreground">
                  ({viewMode === 'month' && selectedMonths.size > 0
                    ? (() => {
                      const selectedMonthsInfo = availableMonths.filter(m => selectedMonths.has(m.value))
                      return selectedMonthsInfo.reduce((sum, m) =>
                        sum + Math.ceil((m.endDate.getTime() - m.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        , 0)
                    })()
                    : totalSemesterDays} days)
                </span>
              </div>
              <div className="relative">
                <Input
                  id="semLabor"
                  type="number"
                  step="0.01"
                  className={`h-8 bg-muted/50 ${(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) ? 'text-transparent' : ''}`}
                  value={(viewMode === 'month' && selectedMonths.size > 0 ? monthLaborPerDay : semLaborCharge).toFixed(2)}
                  disabled
                />
                {(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="overallProvision" className="text-xs text-muted-foreground">Total Provision Cost</Label>
              <div className="relative">
                <Input
                  id="overallProvision"
                  type="number"
                  className={`h-8 bg-muted/50 ${(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) ? 'text-transparent' : ''}`}
                  value={(viewMode === 'month' && selectedMonths.size > 0 ? monthTotalProvision : totalProvisionUsage).toFixed(2)}
                  disabled
                />
                {(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="semProvision" className="text-xs text-muted-foreground">Provision / day</Label>
              <div className="relative">
                <Input
                  id="semProvision"
                  type="number"
                  step="0.01"
                  className={`h-8 pr-8 ${(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}
                  value={(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) ? "..." : (viewMode === 'month' && selectedMonths.size > 0 ? monthProvisionPerDay : calculatedProvisionCharge).toFixed(2)}
                  disabled={true}
                />
                {(viewMode === 'semester' ? loadingProvisionCharge : loadingMonthProvision) && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="semAdvance" className="text-xs text-muted-foreground">Advance ({semAdvanceAmount.toString()})</Label>
              <div className="relative">
                <Input
                  id="semAdvance"
                  type="number"
                  className={`h-8 bg-muted/50 ${loadingProvisionCharge ? 'text-transparent' : ''}`}
                  value={semAdvanceAmount.toFixed(2)}
                  disabled={true}
                />
                {loadingProvisionCharge && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={updateSemBillingSettings} disabled={updatingSem} size="sm" className="px-4">
              <Save className="w-3.5 h-3.5 mr-2" />
              {updatingSem ? "Updating Settings..." : "Update Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">Filters</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFilters({
              hostel: "all",
              year: "all",
              status: "all",
              dept: "all",
              search: "",
            })}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Name or roll number..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Hostel Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hostel</Label>
              <Select value={filters.hostel} onValueChange={(value) => setFilters(prev => ({ ...prev, hostel: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hostels</SelectItem>
                  <SelectItem value="Boys">Boys Hostel</SelectItem>
                  <SelectItem value="Girls">Girls Hostel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</Label>
              <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
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
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="VACATED">Vacated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dept Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dept</Label>
              <Select value={filters.dept} onValueChange={(value) => setFilters(prev => ({ ...prev, dept: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  <SelectItem value="cse">CSE</SelectItem>
                  <SelectItem value="ece">ECE</SelectItem>
                  <SelectItem value="eee">EEE</SelectItem>
                  <SelectItem value="mech">Mech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table for Sem */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Student Payment Overview <span className="text-muted-foreground font-normal ml-2 text-sm">{selectedSemester ? `${selectedSemester.name} (${new Date(selectedSemester.startDate).toLocaleDateString()} - ${new Date(selectedSemester.endDate).toLocaleDateString()})` : 'No Semester Selected'}</span>
            </CardTitle>
            <div className="flex gap-2">
              {selectedSemester && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forceRefetchSemesterData(selectedSemester)}
                  disabled={loadingStudentsSem || loadingProvisionCharge}
                  className="h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loadingStudentsSem || loadingProvisionCharge ? 'animate-spin' : ''}`} />
                  Force Refresh
                </Button>
              )}
              {selectedSemester && viewMode === 'semester' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" onClick={updatePayments} disabled={updatingPayments} className="h-9">
                        {updatingPayments ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-2"></div>
                        ) : (
                          <Save className="w-3.5 h-3.5 mr-2" />
                        )}
                        {updatingPayments ? "Updating..." : "Update Payments"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save payments data of this semester</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {selectedSemester && viewMode === 'month' && selectedMonths.size > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" onClick={updateMonthlyPayments} disabled={updatingPayments || loadingMonthData} className="h-9">
                        {updatingPayments ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-2"></div>
                        ) : (
                          <Save className="w-3.5 h-3.5 mr-2" />
                        )}
                        {updatingPayments ? "Saving..." : "Save Monthly Balances"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save balance amounts for selected month(s)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bulk Actions - only in Semester View */}
          {viewMode === 'semester' && selectedStudents.size > 0 && (
            <div className="m-4 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">
                  {selectedStudents.size} student{selectedStudents.size > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleBulkMarkPaid}
                    disabled={markingSelectedPaid}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  >
                    {markingSelectedPaid ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                        Processing...
                      </>
                    ) : (
                      "Mark Selected as Paid"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedStudents(new Set())
                      setSelectAll(false)
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading and Empty States */}
          {(viewMode === 'semester' ? (loadingStudentsSem || loadingProvisionCharge || loadingFeeRecords) : loadingMonthData) ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <span className="text-sm font-medium text-muted-foreground">
                {viewMode === 'month' ? "Loading month data..." :
                  loadingProvisionCharge ? "Calculating provision charges..." :
                    loadingFeeRecords ? "Loading fee records..." :
                      "Loading student data..."}
              </span>
              <span className="text-xs text-muted-foreground/60 mt-1">Please wait while we prepare the billing data</span>
            </div>
          ) : !selectedSemester ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
              <span className="text-base font-medium text-muted-foreground">No semester selected</span>
              <span className="text-sm text-muted-foreground/60 mt-1">Please select a semester to view student billing data</span>
            </div>
          ) : (viewMode === 'month' && selectedMonths.size === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
              <span className="text-base font-medium text-muted-foreground">No months selected</span>
              <span className="text-sm text-muted-foreground/60 mt-1">Please select one or more months to view billing data</span>
            </div>
          ) : (viewMode === 'semester' ? studentsSem.length === 0 : monthStudentsData.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
              <span className="text-base font-medium text-muted-foreground">No students found</span>
              <span className="text-sm text-muted-foreground/60 mt-1">No billing data available for this {viewMode === 'month' ? 'month selection' : 'semester'}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    {/* Checkbox - only in Semester View */}
                    {viewMode === 'semester' && (
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-input text-primary focus:ring-primary shadow-sm h-4 w-4"
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[200px] font-semibold">Student</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Labour Days</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Prov. Days</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Labor Cost</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Prov. Cost</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Carry Fwd</TableHead>
                    {/* To Pay (Adv) - only in Semester View */}
                    {viewMode === 'semester' && (
                      <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">To Pay (Adv)</TableHead>
                    )}
                    {/* Adv Paid - in Semester View, or Month View only if first month selected */}
                    {(viewMode === 'semester' || (viewMode === 'month' && availableMonths.find(m => selectedMonths.has(m.value))?.isFirstMonth)) && (
                      <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Adv Paid</TableHead>
                    )}
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Balance</TableHead>
                    {/* Actions - only in Semester View */}
                    {viewMode === 'semester' && (
                      <TableHead className="text-center font-semibold">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {(viewMode === 'semester' ? filteredStudentsSem : monthStudentsData.filter(student => {
                    const matchesSearch = student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                      student.rollNo.toLowerCase().includes(filters.search.toLowerCase())
                    const matchesHostel = filters.hostel === "all" || student.hostel === filters.hostel
                    const matchesYear = filters.year === "all" || student.year?.toString() === filters.year
                    const matchesStatus = filters.status === "all" || student.status === filters.status
                    const matchesDept = filters.dept === "all" || student.dept === filters.dept
                    const isNotMando = !student.isMando
                    return matchesSearch && matchesHostel && matchesYear && matchesStatus && matchesDept && isNotMando
                  })).map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/40 transition-colors">
                      {/* Checkbox - only in Semester View */}
                      {viewMode === 'semester' && (
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {student.name}
                          <Badge
                            variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={`text-[10px] px-1.5 py-0 h-5 shadow-none ${student.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                          >
                            {student.status === 'ACTIVE' ? 'Active' : 'Vacated'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center space-x-1.5 mt-1">
                          <span>{student.rollNo}</span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground/80">{student.dept || 'N/A'}</span>
                          <span className="text-border">•</span>
                          <span>{student.hostel}</span>
                          {student.isMando && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-200/50 shadow-none ml-1">
                              Mando
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{student.labourMandays}</TableCell>
                      <TableCell className="text-right tabular-nums">{student.provisionMandays}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">₹{student.laborCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">₹{student.provisionCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={`${student.carryForwardAmount > 0 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"}`}>
                          ₹{student.carryForwardAmount.toFixed(2)}
                        </span>
                      </TableCell>
                      {/* To Pay (Adv) - only in Semester View */}
                      {viewMode === 'semester' && (
                        <TableCell className="text-right tabular-nums">
                          <Badge
                            variant={student.advanceAmountToPay >= 0 ? "outline" : "destructive"}
                            className={`shadow-none font-medium ${student.advanceAmountToPay >= 0
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}
                          >
                            ₹{student.advanceAmountToPay.toFixed(2)}
                          </Badge>
                        </TableCell>
                      )}
                      {/* Adv Paid - in Semester View, or Month View only if first month selected */}
                      {(viewMode === 'semester' || (viewMode === 'month' && availableMonths.find(m => selectedMonths.has(m.value))?.isFirstMonth)) && (
                        <TableCell className="text-right tabular-nums font-medium">₹{student.advancePaid.toFixed(2)}</TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">
                        <Badge
                          variant={student.totalAmount >= 0 ? "default" : "destructive"}
                          className={`shadow-none font-bold ${student.totalAmount >= 0
                            ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200/50"
                            : "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/20"
                            }`}
                        >
                          ₹{student.totalAmount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      {/* Actions - only in Semester View */}
                      {viewMode === 'semester' && (
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            {student.advancePaid === 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleStudentPayment(student.id, 'markPaid')}
                                disabled={loadingStudentPayments.has(student.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5 py-1 h-7 text-white shadow-sm"
                              >
                                {loadingStudentPayments.has(student.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                    Processing...
                                  </>
                                ) : (
                                  "Mark Paid"
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStudentPayment(student.id, 'markUnpaid')}
                                disabled={loadingStudentPayments.has(student.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/5 text-xs px-2.5 py-1 h-7 border-destructive/20"
                              >
                                {loadingStudentPayments.has(student.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-destructive mr-1"></div>
                                    Processing...
                                  </>
                                ) : (
                                  "Unpaid"
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

  )
}

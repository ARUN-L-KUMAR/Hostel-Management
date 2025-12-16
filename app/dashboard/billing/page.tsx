"use client"

import { useState, useEffect } from "react"
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
    mandoFilter: "all",
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

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

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
          console.log("[DEBUG] Auto-selecting first semester:", data[0].name)
          setSelectedSemesterId(data[0].id.toString())
          setSelectedSemester(data[0])
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
          console.log("[DEBUG] Usage record:", usage.quantity, "units *", usage.provisionItem?.unitCost, "cost/unit =", cost, "on", usage.date)
          return sum + cost
        }, 0)

        console.log("[DEBUG] Total provision cost used:", totalCost)

        // Store total provision usage cost
        setTotalProvisionUsage(totalCost)
        console.log("[DEBUG] Total provision usage cost stored:", totalCost)

        // Calculate provision charge per day
        const provisionChargePerDay = totalDays > 0 ? totalCost / totalDays : 0
        console.log("[DEBUG] Provision charge per day calculated:", provisionChargePerDay)

        setCalculatedProvisionCharge(provisionChargePerDay)
        setSemProvisionCharge(provisionChargePerDay)

        // Note: Student data refresh is now handled by forceRefetchSemesterData in the useEffect
        console.log("[DEBUG] Provision charge calculated, data refresh will be handled by force refresh mechanism")
      } else {
        const errorText = await response.text()
        console.error("[DEBUG] Failed to fetch provision usage. Status:", response.status, "Response:", errorText)
        setCalculatedProvisionCharge(0)
        setSemProvisionCharge(0)
      }
    } catch (error) {
      console.error("[DEBUG] Error calculating provision charge:", error)
      setCalculatedProvisionCharge(0)
      setSemProvisionCharge(0)
      setTotalProvisionUsage(0)
    } finally {
      console.log("[DEBUG] Finished provision charge calculation")
      console.log("[DEBUG] === PROVISION CHARGE CALCULATION COMPLETED ===")
      setLoadingProvisionCharge(false)
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
      // Step 1: Calculate provision charge
      console.log("[DEBUG] Step 1: Calculating provision charge")
      await calculateProvisionChargePerDay(semester)

      // Step 2: Wait longer for state to settle and async operations to complete
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 3: Fetch fee records
      console.log("[DEBUG] Step 3: Fetching fee records")
      await fetchFeeRecords(semester.id.toString())

      // Step 4: Wait again for fee records to settle
      await new Promise(resolve => setTimeout(resolve, 200))

      // Step 5: Fetch student data with fresh calculations
      console.log("[DEBUG] Step 5: Fetching student data")
      await fetchSemStudentsData()

      console.log("[DEBUG] === FORCE REFETCH COMPLETED SUCCESSFULLY ===")
    } catch (error) {
      console.error("[DEBUG] Error during force refetch:", error)
      // Reset loading states on error
      setLoadingProvisionCharge(false)
      setLoadingStudentsSem(false)
      setLoadingFeeRecords(false)
    }
  }

  // Handle semester selection
  const handleSemesterChange = (semesterId: string) => {
    console.log("[DEBUG] === SEMESTER SELECTION START ===")
    console.log("[DEBUG] FUNCTION CALLED - handleSemesterChange with ID:", semesterId)

    // Step 1: Force reset all state immediately
    setSelectedSemesterId(semesterId)
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

        // Step 2: Set basic semester data
        const baseAmount = semester.feeStructures[0]?.baseAmount || 0
        setSemAdvanceAmount(baseAmount)

        // The useEffect will handle the data fetching
      } else {
        console.log("[DEBUG] No semester found for ID:", semesterId)
        setShowCreateSemester(false)
        setSelectedSemester(null)
      }
    }
    console.log("[DEBUG] === SEMESTER SELECTION END ===")
  }

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
        description: `Billing parameters updated for ${selectedSemester.name}.`,
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

    const filename = `billing-${selectedSemester.name.replace(/\s+/g, '-').toLowerCase()}.csv`

    // Calculate total days
    const startDate = new Date(selectedSemester.startDate)
    const endDate = new Date(selectedSemester.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Billing parameters
    const params = [
      ["Billing Parameters"],
      ["Semester", selectedSemester.name],
      ["From Date", selectedSemester.startDate],
      ["To Date", selectedSemester.endDate],
      ["Total Days", totalDays.toString()],
      ["Labor Charge (per day)", semLaborCharge.toString()],
      ["Provision Charge (per day)", semProvisionCharge.toString()],
      ["Advance Amount", semAdvanceAmount.toString()],
      [""], // Empty row
      ["Student Billing Data"],
      ["Student", "Roll No", "Dept", "Hostel", "Labour Mandays", "Provision Mandays", "Labor Charge", "Provision Charges", "Carry Forward", "Advance Amount to Pay", "Advance Paid", "Balance Amount"]
    ]

    // Student data
    filteredStudentsSem.forEach(student => {
      params.push([
        student.name,
        student.rollNo,
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
      ])
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

    const matchesMando = filters.mandoFilter === "all" ||
      (filters.mandoFilter === "mando" && student.isMando) ||
      (filters.mandoFilter === "regular" && !student.isMando)

    return matchesSearch && matchesHostel && matchesYear && matchesStatus && matchesDept && matchesMando
  })

  const fetchSemStudentsData = async (overrideProvisionCharge?: number) => {
    if (!selectedSemester) {
      setStudentsSem([])
      setLoadingStudentsSem(false)
      return
    }

    setLoadingStudentsSem(true)
    try {
      const startDate = new Date(selectedSemester.startDate)
      const endDate = new Date(selectedSemester.endDate)

      // Get all semesters once for carry forward calculations
      const allSemestersResponse = await fetch('/api/semesters')
      if (!allSemestersResponse.ok) {
        throw new Error("Failed to fetch semesters")
      }
      const allSemesters = await allSemestersResponse.json()

      // Find the semester that ended just before the current semester started
      const currentSemesterStart = new Date(selectedSemester.startDate)
      let previousSemester = null
      let smallestTimeDiff = Infinity

      for (const semester of allSemesters) {
        if (semester.id !== selectedSemester.id) {
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
      const feeRecordsResponse = await fetch(`/api/fee-records?semesterId=${selectedSemester.id}`)
      if (!feeRecordsResponse.ok) {
        throw new Error("Failed to fetch fee records")
      }
      const feeRecords = await feeRecordsResponse.json()

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
            // If previous balance was positive (student owed), subtract from current
            // If previous balance was negative (student was owed), add to current
            carryForwardAmount = -prevBalance // Reverse the sign
          }
        }

        // Get the base amount for this semester
        const semesterBaseAmount = selectedSemester?.feeStructures[0]?.baseAmount || 0

        const provisionChargeToUse = overrideProvisionCharge !== undefined ? overrideProvisionCharge : semProvisionCharge
        const laborCharge = labourMandays * semLaborCharge
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

  // Removed the useEffect that was causing conflicts - now handled in handleSemesterChange

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Billing Overview</h1>
          <p className="text-slate-600">View and manage student payment amounts with labor, provision, and advance calculations</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="space-y-6">
        {/* Semester Selection */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Semester Range Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="semesterSelect">Select Semester</Label>
                  {loadingSemesters ? (
                    <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-white">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Loading semesters...</span>
                    </div>
                  ) : (
                    <Select value={selectedSemesterId} onValueChange={handleSemesterChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map(semester => (
                          <SelectItem key={semester.id} value={semester.id.toString()}>
                            {semester.name} ({new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()})
                          </SelectItem>
                        ))}
                        <SelectItem value="create-new">+ Create New Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {showCreateSemester && (
                <Card className="border border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Create New Semester</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semesterName">Semester Name</Label>
                        <Input
                          id="semesterName"
                          placeholder="e.g., Sem 1 - 2025"
                          value={newSemesterName}
                          onChange={(e) => setNewSemesterName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="baseAmount">Base Amount</Label>
                        <Input
                          id="baseAmount"
                          type="number"
                          placeholder="15000"
                          value={newSemesterBaseAmount}
                          onChange={(e) => setNewSemesterBaseAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newSemesterStartDate}
                          onChange={(e) => setNewSemesterStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newSemesterEndDate}
                          onChange={(e) => setNewSemesterEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateSemester(false)}>
                        Cancel
                      </Button>
                      <Button onClick={editingSemesterId ? updateSemester : createNewSemester} disabled={creatingSemester}>
                        {creatingSemester ? (editingSemesterId ? "Updating..." : "Creating...") : (editingSemesterId ? "Update Semester" : "Create Semester")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedSemester && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-green-800">{selectedSemester.name}</h3>
                      <p className="text-sm text-green-600">
                        {new Date(selectedSemester.startDate).toLocaleDateString()} - {new Date(selectedSemester.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-green-600">
                        Base Amount: ₹{selectedSemester.feeStructures[0]?.baseAmount || 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editSemester(selectedSemester)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSemester(selectedSemester.id, selectedSemester.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
                <div className="relative">
                  <Input
                    id="semProvision"
                    type="number"
                    step="0.01"
                    value={loadingProvisionCharge ? "Fetching provision data..." : calculatedProvisionCharge.toFixed(2)}
                    disabled={true}
                    className={`pr-8 ${loadingProvisionCharge ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
                  />
                  {loadingProvisionCharge && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                <Input
                  id="semAdvance"
                  type="number"
                  value={semAdvanceAmount.toFixed(2)}
                  disabled={true}
                  className="bg-gray-50"
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


        {/* Filters */}
        <Card className="p-4 border-0 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-900">Filters</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFilters({
              hostel: "all",
              year: "all",
              status: "all",
              mandoFilter: "all",
              dept: "all",
              search: "",
            })}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Name or roll number..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Hostel Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Hostel</Label>
              <Select value={filters.hostel} onValueChange={(value) => setFilters(prev => ({ ...prev, hostel: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Hostels</SelectItem>
                  <SelectItem value="Boys">Boys Hostel</SelectItem>
                  <SelectItem value="Girls">Girls Hostel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Year</Label>
              <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="VACATED">Vacated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dept Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Dept</Label>
              <Select value={filters.dept} onValueChange={(value) => setFilters(prev => ({ ...prev, dept: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Depts</SelectItem>
                  <SelectItem value="cse">CSE</SelectItem>
                  <SelectItem value="ece">ECE</SelectItem>
                  <SelectItem value="eee">EEE</SelectItem>
                  <SelectItem value="mech">Mech</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mando Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Mando Filter</Label>
              <Select value={filters.mandoFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, mandoFilter: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select mando filter" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="mando">Mando Students Only</SelectItem>
                  <SelectItem value="regular">Regular Students Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Students Table for Sem */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Student Payment Overview - {selectedSemester ? `${selectedSemester.name} (${new Date(selectedSemester.startDate).toLocaleDateString()} - ${new Date(selectedSemester.endDate).toLocaleDateString()})` : 'No Semester Selected'}
              </CardTitle>
              <div className="flex gap-2">
                {selectedSemester && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => forceRefetchSemesterData(selectedSemester)}
                    disabled={loadingStudentsSem || loadingProvisionCharge}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingStudentsSem || loadingProvisionCharge ? 'animate-spin' : ''}`} />
                    Force Refresh
                  </Button>
                )}
                {selectedSemester && (
                  <Button variant="outline" onClick={updatePayments} disabled={updatingPayments}>
                    {updatingPayments ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {updatingPayments ? "Updating..." : "Update Payments"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            {selectedStudents.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    {selectedStudents.size} student{selectedStudents.size > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={handleBulkMarkPaid}
                      disabled={markingSelectedPaid}
                      className="bg-green-600 hover:bg-green-700 text-white"
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
                      variant="outline"
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

            {loadingStudentsSem || loadingProvisionCharge || loadingFeeRecords ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <span className="text-sm font-medium text-slate-600">
                  {loadingProvisionCharge ? "Calculating provision charges..." :
                    loadingFeeRecords ? "Loading fee records..." :
                      "Loading student data..."}
                </span>
                <span className="text-xs text-slate-400 mt-1">Please wait while we prepare the billing data</span>
              </div>
            ) : !selectedSemester ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="text-4xl mb-4">📅</div>
                <span className="text-sm font-medium">No semester selected</span>
                <span className="text-xs text-slate-400 mt-1">Please select a semester to view student billing data</span>
              </div>
            ) : studentsSem.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="text-4xl mb-4">👥</div>
                <span className="text-sm font-medium">No students found</span>
                <span className="text-xs text-slate-400 mt-1">No billing data available for this semester</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Labour Mandays</TableHead>
                    <TableHead className="text-right">Provision Mandays</TableHead>
                    <TableHead className="text-right">Labor Charge</TableHead>
                    <TableHead className="text-right">Provision Charges</TableHead>
                    <TableHead className="text-right">Carry Forward</TableHead>
                    <TableHead className="text-right">Advance Amount to Pay</TableHead>
                    <TableHead className="text-right">Advance Paid</TableHead>
                    <TableHead className="text-right">Balance Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentsSem.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {student.name}
                          <Badge
                            variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={`text-xs px-2 py-0 ${student.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {student.status === 'ACTIVE' ? 'Active' : 'Vacated'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-2">
                          <span>{student.rollNo}</span>
                          <span>•</span>
                          <span className="text-slate-400">{student.dept || 'Not Set'}</span>
                          <span>•</span>
                          <span>{student.hostel}</span>
                          {student.isMando && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Mando
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{student.labourMandays}</TableCell>
                      <TableCell className="text-right">{student.provisionMandays}</TableCell>
                      <TableCell className="text-right">₹{student.laborCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{student.provisionCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-orange-600">₹{student.carryForwardAmount.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={student.advanceAmountToPay >= 0 ? "default" : "destructive"}
                          className={student.advanceAmountToPay >= 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}
                        >
                          ₹{student.advanceAmountToPay.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{student.advancePaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={student.totalAmount >= 0 ? "default" : "destructive"}
                          className={student.totalAmount >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          ₹{student.totalAmount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          {student.advancePaid === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => handleStudentPayment(student.id, 'markPaid')}
                              disabled={loadingStudentPayments.has(student.id)}
                              className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 text-white"
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
                              className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                            >
                              {loadingStudentPayments.has(student.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600 mr-1"></div>
                                  Processing...
                                </>
                              ) : (
                                "Unpaid"
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  )
}

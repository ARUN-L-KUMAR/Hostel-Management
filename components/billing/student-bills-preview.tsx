"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Eye } from "lucide-react"

interface StudentBillsPreviewProps {
  data: {
    totalExpense: number
    totalMandays: number
    perDayRate: number
    mandoCoverage: number
    carryForward: number
    advanceTotal: number
  }
  onNext: () => void
  onBack: () => void
}

interface StudentBill {
  id: string
  name: string
  rollNo: string
  dept: string | null
  hostel: string
  isMando: boolean
  mandays: number
  grossAmount: number
  adjustments: number
  finalAmount: number
  status: string
}

export function StudentBillsPreview({ data, onNext, onBack }: StudentBillsPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [studentBills, setStudentBills] = useState<StudentBill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentBills = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/billing/overview?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`)
        if (!response.ok) {
          throw new Error("Failed to fetch billing data")
        }
        const billingData = await response.json()
        
        // Transform the student data into bill format
        const bills: StudentBill[] = billingData.students.map((student: any) => ({
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          dept: student.dept,
          hostel: student.hostel,
          isMando: student.isMando || false,
          mandays: student.mandays,
          grossAmount: student.laborCharge + student.provisionCharge,
          adjustments: 0, // Default to 0, can be enhanced later
          finalAmount: student.isMando ? 0 : student.laborCharge + student.provisionCharge,
          status: student.isMando ? "covered" : "unpaid"
        }))
        
        setStudentBills(bills)
      } catch (error) {
        console.error("Error fetching student bills:", error)
        setStudentBills([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudentBills()
  }, [])

  const filteredBills = studentBills.filter(
    (bill) =>
      bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.dept && bill.dept.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const totalRegularBills = filteredBills
    .filter((bill) => !bill.isMando)
    .reduce((sum, bill) => sum + bill.finalAmount, 0)

  const totalMandoCoverage = filteredBills
    .filter((bill) => bill.isMando)
    .reduce((sum, bill) => sum + bill.grossAmount, 0)

  const mandoStudentsCount = filteredBills.filter((bill) => bill.isMando).length
  const regularStudentsCount = filteredBills.filter((bill) => !bill.isMando).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-900">{regularStudentsCount}</div>
            <div className="text-sm text-slate-600">Regular Students</div>
            <div className="text-xs text-green-600 mt-1">₹{totalRegularBills.toLocaleString()} total</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{mandoStudentsCount}</div>
            <div className="text-sm text-slate-600">Mando Students</div>
            <div className="text-xs text-orange-600 mt-1">₹{totalMandoCoverage.toLocaleString()} covered</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">₹{data.mandoCoverage.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Mando Budget</div>
            <div className="text-xs text-blue-600 mt-1">
              ₹{(data.mandoCoverage - totalMandoCoverage).toLocaleString()} remaining
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-900">
              ₹{(totalRegularBills + totalMandoCoverage).toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Total Billing</div>
            <div className="text-xs text-slate-600 mt-1">All students combined</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Bills Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Bills Preview</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Mandays</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead className="text-right">Adjustments</TableHead>
                <TableHead className="text-right">Final Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    Loading student bills...
                  </TableCell>
                </TableRow>
              ) : filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    No student bills found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{bill.name}</div>
                        <div className="text-sm text-slate-500">{bill.rollNo}</div>
                      </div>
                    </TableCell>
                    <TableCell>{bill.dept || 'Not Set'}</TableCell>
                    <TableCell>{bill.hostel}</TableCell>
                    <TableCell>
                      {bill.isMando ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Mando
                        </Badge>
                      ) : (
                        <Badge variant="outline">Regular</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{bill.mandays}</TableCell>
                    <TableCell className="text-right">₹{bill.grossAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {bill.adjustments !== 0 && (
                        <span className={bill.adjustments > 0 ? "text-red-600" : "text-green-600"}>
                          {bill.adjustments > 0 ? "+" : ""}₹{bill.adjustments.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {bill.isMando ? (
                        <span className="text-orange-600">₹0.00 (Covered)</span>
                      ) : (
                        <span>₹{bill.finalAmount.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={bill.status === "covered" ? "secondary" : "outline"}
                        className={
                          bill.status === "covered" ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {bill.status === "covered" ? "Mando Covered" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Overview
        </Button>
        <Button onClick={onNext}>Make Adjustments</Button>
      </div>
    </div>
  )
}

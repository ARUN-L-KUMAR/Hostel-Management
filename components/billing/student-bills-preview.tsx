"use client"

import { useState } from "react"
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

// Mock student bills data
const studentBills = [
  {
    id: "1",
    name: "Arjun Kumar",
    rollNo: "B21001",
    hostel: "Boys",
    isMando: false,
    mandays: 28,
    grossAmount: 1385.44,
    adjustments: 0,
    finalAmount: 1385.44,
    status: "unpaid",
  },
  {
    id: "2",
    name: "Rahul Sharma",
    rollNo: "B21002",
    hostel: "Boys",
    isMando: true,
    mandays: 30,
    grossAmount: 1484.4,
    adjustments: 0,
    finalAmount: 0, // Covered by Mando
    status: "covered",
  },
  {
    id: "3",
    name: "Vikram Singh",
    rollNo: "B21003",
    hostel: "Boys",
    isMando: false,
    mandays: 25,
    grossAmount: 1237.0,
    adjustments: -200, // Some adjustment
    finalAmount: 1037.0,
    status: "unpaid",
  },
  {
    id: "4",
    name: "Sneha Patel",
    rollNo: "G21032",
    hostel: "Girls",
    isMando: true,
    mandays: 29,
    grossAmount: 1434.92,
    adjustments: 0,
    finalAmount: 0, // Covered by Mando
    status: "covered",
  },
  {
    id: "5",
    name: "Pooja Singh",
    rollNo: "G21033",
    hostel: "Girls",
    isMando: false,
    mandays: 31,
    grossAmount: 1533.88,
    adjustments: 0,
    finalAmount: 1533.88,
    status: "unpaid",
  },
]

export function StudentBillsPreview({ data, onNext, onBack }: StudentBillsPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")

  const filteredBills = studentBills.filter(
    (bill) =>
      bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.rollNo.toLowerCase().includes(searchQuery.toLowerCase()),
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
              {filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{bill.name}</div>
                      <div className="text-sm text-slate-500">{bill.rollNo}</div>
                    </div>
                  </TableCell>
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
              ))}
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

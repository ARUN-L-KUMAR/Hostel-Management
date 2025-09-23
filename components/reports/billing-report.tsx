"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const billingData = [
  { category: "Regular Students", amount: 154320, count: 38, color: "#3b82f6" },
  { category: "Mando Coverage", amount: 45680, count: 12, color: "#f97316" },
  { category: "Adjustments", amount: -2400, count: 3, color: "#ef4444" },
]

const paymentData = [
  { status: "Paid", amount: 142500, count: 35, color: "#10b981" },
  { status: "Pending", amount: 54600, count: 12, color: "#f59e0b" },
  { status: "Overdue", amount: 8200, count: 3, color: "#ef4444" },
]

export function BillingReport() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,97,600</div>
            <p className="text-xs text-muted-foreground">For January 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89.2%</div>
            <Progress value={89.2} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹21,340</div>
            <p className="text-xs text-muted-foreground">15 students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Billing Breakdown</CardTitle>
            <CardDescription>Distribution of billing amounts by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={billingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Current payment status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {paymentData.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{item.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{item.count} students</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Bills</CardTitle>
          <CardDescription>Students with pending or overdue payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Rajesh Kumar", rollNo: "21CS015", amount: 4250, days: 5, status: "pending" },
              { name: "Anita Verma", rollNo: "21CS028", amount: 3800, days: 12, status: "overdue" },
              { name: "Suresh Patel", rollNo: "21CS033", amount: 5100, days: 3, status: "pending" },
              { name: "Meera Singh", rollNo: "21CS041", amount: 2900, days: 18, status: "overdue" },
            ].map((bill) => (
              <div key={bill.rollNo} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-muted-foreground">{bill.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">₹{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Amount Due</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{bill.days} days</p>
                    <p className="text-xs text-muted-foreground">Since due</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={bill.status === "overdue" ? "destructive" : "secondary"}>
                      {bill.status === "overdue" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {bill.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Bills
        </Button>
        <Button variant="outline">Send Reminders</Button>
        <Button>Generate Invoice</Button>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const monthlyData = [
  { name: "Week 1", expenses: 45000, mandays: 1200 },
  { name: "Week 2", expenses: 52000, mandays: 1350 },
  { name: "Week 3", expenses: 48000, mandays: 1280 },
  { name: "Week 4", expenses: 55000, mandays: 1400 },
]

const categoryData = [
  { name: "Vegetables", value: 35, color: "#3b82f6" },
  { name: "Rice/Grains", value: 25, color: "#f97316" },
  { name: "Dairy", value: 20, color: "#10b981" },
  { name: "Spices", value: 12, color: "#f59e0b" },
  { name: "Others", value: 8, color: "#6b7280" },
]

export function MonthlyReport() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2,00,000</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              -5.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mandays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,230</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Per Day Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹38.24</div>
            <div className="flex items-center text-sm text-red-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +7.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mando Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,680</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Minus className="h-4 w-4 mr-1" />
              65% of budget used
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Expenses & Mandays</CardTitle>
            <CardDescription>Comparison of expenses and mandays over the month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="expenses" fill="#3b82f6" name="Expenses (₹)" />
                <Bar dataKey="mandays" fill="#f97316" name="Mandays" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button>Generate Detailed Report</Button>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Shield } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const mandoCoverageData = [
  { month: "Oct", boys: 18500, girls: 8200, total: 26700 },
  { month: "Nov", boys: 22300, girls: 9800, total: 32100 },
  { month: "Dec", boys: 28900, girls: 11200, total: 40100 },
  { month: "Jan", boys: 32400, girls: 13280, total: 45680 },
]

const mandoStudents = [
  { name: "Arjun Reddy", rollNo: "21CS007", hostel: "Boys A", mandays: 28, coverage: 1400 },
  { name: "Kavya Nair", rollNo: "21CS012", hostel: "Girls A", mandays: 30, coverage: 1500 },
  { name: "Rohit Sharma", rollNo: "21CS019", hostel: "Boys B", mandays: 26, coverage: 1300 },
  { name: "Priya Menon", rollNo: "21CS024", hostel: "Girls A", mandays: 29, coverage: 1450 },
  { name: "Vikram Singh", rollNo: "21CS031", hostel: "Boys A", mandays: 31, coverage: 1550 },
  { name: "Ananya Das", rollNo: "21CS036", hostel: "Girls B", mandays: 27, coverage: 1350 },
]

export function MandoReport() {
  const totalBudget = 70250
  const usedBudget = 45680
  const remainingBudget = totalBudget - usedBudget
  const utilizationRate = (usedBudget / totalBudget) * 100

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹70,250</div>
            <p className="text-xs text-muted-foreground">Annual allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,680</div>
            <Progress value={utilizationRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{utilizationRate.toFixed(1)}% used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹24,570</div>
            <p className="text-xs text-muted-foreground">Available for coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mando Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">8 boys, 4 girls</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Coverage Trend</CardTitle>
            <CardDescription>Mando budget utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mandoCoverageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Coverage"]} />
                <Line type="monotone" dataKey="boys" stroke="#3b82f6" strokeWidth={2} name="Boys" />
                <Line type="monotone" dataKey="girls" stroke="#f97316" strokeWidth={2} name="Girls" />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Distribution between boys and girls hostels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Boys Hostel</span>
                  <span className="text-sm">₹58,200 allocated</span>
                </div>
                <Progress value={(32400 / 58200) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">₹32,400 used (55.7%)</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Girls Hostel</span>
                  <span className="text-sm">₹12,052 allocated</span>
                </div>
                <Progress value={(13280 / 12052) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">₹13,280 used (110.2%) - Over budget</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Utilization</span>
                  <span className="font-medium">₹45,680 / ₹70,250</span>
                </div>
                <Progress value={utilizationRate} className="mt-2 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mando Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mando Students Coverage</CardTitle>
          <CardDescription>Individual coverage details for Mando students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mandoStudents.map((student) => (
              <div key={student.rollNo} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.rollNo} • {student.hostel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{student.mandays}</p>
                    <p className="text-xs text-muted-foreground">Mandays</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">₹{student.coverage}</p>
                    <p className="text-xs text-muted-foreground">Coverage</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Covered
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Coverage Summary</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Students</p>
                <p className="font-medium">12 Mando students</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Mandays</p>
                <p className="font-medium">171 days</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average Coverage</p>
                <p className="font-medium">₹1,423 per student</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining Budget</p>
                <p className="font-medium text-green-600">₹24,570</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Coverage Report
        </Button>
        <Button>Adjust Budget Allocation</Button>
      </div>
    </div>
  )
}

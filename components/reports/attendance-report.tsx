"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, AlertTriangle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const attendanceData = [
  { date: "Jan 1", present: 45, leave: 3, casual: 2 },
  { date: "Jan 2", present: 47, leave: 2, casual: 1 },
  { date: "Jan 3", present: 46, leave: 3, casual: 1 },
  { date: "Jan 4", present: 48, leave: 1, casual: 1 },
  { date: "Jan 5", present: 44, leave: 4, casual: 2 },
  { date: "Jan 6", present: 46, leave: 3, casual: 1 },
  { date: "Jan 7", present: 49, leave: 1, casual: 0 },
]

const hostelData = [
  { hostel: "Boys Hostel A", attendance: 92, students: 25 },
  { hostel: "Boys Hostel B", attendance: 88, students: 20 },
  { hostel: "Girls Hostel A", attendance: 95, students: 15 },
  { hostel: "Girls Hostel B", attendance: 90, students: 10 },
]

export function AttendanceReport() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91.2%</div>
            <Progress value={91.2} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Across all students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Casual Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Non-chargeable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trend</CardTitle>
            <CardDescription>Present, leave, and casual attendance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                <Line type="monotone" dataKey="leave" stroke="#f59e0b" strokeWidth={2} name="Leave" />
                <Line type="monotone" dataKey="casual" stroke="#6b7280" strokeWidth={2} name="Casual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hostel-wise Attendance</CardTitle>
            <CardDescription>Attendance percentage by hostel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hostelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="hostel" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Summary</CardTitle>
          <CardDescription>Individual student attendance patterns and issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Rahul Kumar", rollNo: "21CS001", attendance: 95, leaves: 2, issues: 0 },
              { name: "Priya Sharma", rollNo: "21CS002", attendance: 88, leaves: 6, issues: 1 },
              { name: "Amit Singh", rollNo: "21CS003", attendance: 92, leaves: 4, issues: 0 },
              { name: "Sneha Patel", rollNo: "21CS004", attendance: 78, leaves: 11, issues: 2 },
            ].map((student) => (
              <div key={student.rollNo} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{student.attendance}%</p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{student.leaves}</p>
                    <p className="text-xs text-muted-foreground">Leave Days</p>
                  </div>
                  <div className="text-center">
                    {student.issues > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {student.issues}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No Issues</Badge>
                    )}
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
          Export Attendance
        </Button>
        <Button>Generate Detailed Report</Button>
      </div>
    </div>
  )
}

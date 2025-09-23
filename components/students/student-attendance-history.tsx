import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp } from "lucide-react"

interface StudentAttendanceHistoryProps {
  studentId: string
}

export function StudentAttendanceHistory({ studentId }: StudentAttendanceHistoryProps) {
  // Mock data - in real app, this would come from the database
  const attendanceData = [
    { date: "2024-01-15", status: "P", meal: "Breakfast" },
    { date: "2024-01-15", status: "P", meal: "Lunch" },
    { date: "2024-01-15", status: "L", meal: "Dinner" },
    { date: "2024-01-14", status: "P", meal: "Breakfast" },
    { date: "2024-01-14", status: "P", meal: "Lunch" },
    { date: "2024-01-14", status: "P", meal: "Dinner" },
    { date: "2024-01-13", status: "CN", meal: "Breakfast" },
    { date: "2024-01-13", status: "CN", meal: "Lunch" },
    { date: "2024-01-13", status: "CN", meal: "Dinner" },
    { date: "2024-01-12", status: "P", meal: "Breakfast" },
    { date: "2024-01-12", status: "V", meal: "Lunch" },
    { date: "2024-01-12", status: "P", meal: "Dinner" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "P":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Present
          </Badge>
        )
      case "L":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Leave
          </Badge>
        )
      case "CN":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Casual
          </Badge>
        )
      case "V":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Vacation
          </Badge>
        )
      case "C":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Cancel
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const stats = {
    totalDays: 12,
    presentDays: 8,
    leaveDays: 1,
    casualDays: 3,
    attendanceRate: 75,
  }

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentDays}</div>
            <p className="text-xs text-muted-foreground">Out of {stats.totalDays} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leave Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leaveDays}</div>
            <p className="text-xs text-muted-foreground">Chargeable leaves</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Casual Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.casualDays}</div>
            <p className="text-xs text-muted-foreground">Non-chargeable</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Last 12 meal entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{entry.meal}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">{getStatusBadge(entry.status)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

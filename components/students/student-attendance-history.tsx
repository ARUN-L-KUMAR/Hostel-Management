import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp } from "lucide-react"

interface StudentAttendanceHistoryProps {
  studentId: string
  attendance: any[]
}

export function StudentAttendanceHistory({ studentId, attendance = [] }: StudentAttendanceHistoryProps) {
  // Use passed attendance data or fall back to empty array
  // We need to process the attendance data to match the UI requirements
  // Assuming attendance records are per-day or per-meal. 
  // For now, let's map the raw data directly if it matches, or adapt the UI.

  // Adaptive mapping: If real data exists, use it.
  const displayData = attendance.length > 0 ? attendance.map(record => ({
    date: record.date,
    status: record.status || "P", // Fallback
    meal: record.mealType || "All Day" // Fallback if meal type missing
  })) : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "P":
        return (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0">
            Present
          </Badge>
        )
      case "L":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-0">
            Leave
          </Badge>
        )
      case "CN":
        return (
          <Badge variant="outline" className="text-muted-foreground border-border">
            Casual
          </Badge>
        )
      case "V":
        return (
          <Badge variant="secondary" className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-0">
            Vacation
          </Badge>
        )
      case "C":
        return (
          <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/25 border-0">
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
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.attendanceRate}%</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.presentDays}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats.totalDays} days</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leave Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.leaveDays}</div>
            <p className="text-xs text-muted-foreground mt-1">Chargeable leaves</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Casual Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.casualDays}</div>
            <p className="text-xs text-muted-foreground mt-1">Non-chargeable</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Last 12 meal entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendance.length > 0 ? (
              attendance.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{entry.mealType || "Entry"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

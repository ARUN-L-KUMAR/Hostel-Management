import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Database, FileText, AlertTriangle, CheckCircle } from "lucide-react"

export function DataManagement() {
  return (
    <div className="space-y-6">
      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Current database health and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">2.4 GB</p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">15,847</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-sm text-muted-foreground">Health Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle>Data Import/Export</CardTitle>
          <CardDescription>Manage data import and export operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Import Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Import student data, attendance records, or provision information
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Students
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Attendance
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Provisions
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Export Data</h4>
              <p className="text-sm text-muted-foreground mb-4">Export data for backup or external analysis</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Billing
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
          <CardDescription>Latest data operations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { operation: "Student Data Import", status: "completed", time: "2 hours ago", records: 50 },
              { operation: "Monthly Backup", status: "completed", time: "1 day ago", records: 15847 },
              { operation: "Attendance Export", status: "in-progress", time: "5 minutes ago", records: 1200 },
              { operation: "Billing Data Export", status: "failed", time: "3 hours ago", records: 0 },
            ].map((op, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                    {op.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {op.status === "in-progress" && <Database className="h-5 w-5 text-blue-600" />}
                    {op.status === "failed" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{op.operation}</p>
                    <p className="text-sm text-muted-foreground">{op.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{op.records.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">records</p>
                  </div>
                  <Badge
                    variant={
                      op.status === "completed" ? "default" : op.status === "in-progress" ? "secondary" : "destructive"
                    }
                  >
                    {op.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle>Data Cleanup</CardTitle>
          <CardDescription>Maintain database performance and storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Archive Old Records</h4>
              <p className="text-sm text-muted-foreground">Move records older than 2 years to archive</p>
            </div>
            <Button variant="outline">Archive</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Optimize Database</h4>
              <p className="text-sm text-muted-foreground">Improve query performance and reduce size</p>
            </div>
            <Button variant="outline">Optimize</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
            <div>
              <h4 className="font-medium text-red-600">Delete Test Data</h4>
              <p className="text-sm text-muted-foreground">⚠️ Permanently remove test records</p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

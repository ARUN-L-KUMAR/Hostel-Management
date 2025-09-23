import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react"

export function AlertsBanner() {
  // Mock alerts - in real app, these would come from database
  const alerts = [
    {
      type: "warning" as const,
      message: "Attendance data for 3 students is missing for December 15-20",
    },
    {
      type: "info" as const,
      message: "Monthly billing for December is ready for review",
    },
  ]

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          className={`border-l-4 ${
            alert.type === "warning" ? "border-l-orange-500 bg-orange-50" : "border-l-blue-500 bg-blue-50"
          }`}
        >
          {alert.type === "warning" ? (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          ) : (
            <Info className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription className={alert.type === "warning" ? "text-orange-800" : "text-blue-800"}>
            {alert.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

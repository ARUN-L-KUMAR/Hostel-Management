import { Card } from "@/components/ui/card"

const attendanceCodes = [
  { code: "P", label: "Present", color: "bg-emerald-500", description: "Student was present and had meals" },
  { code: "L", label: "Leave", color: "bg-amber-500", description: "Student on leave but charged" },
  { code: "CN", label: "Concession", color: "bg-blue-500", description: "Student on concession, not charged" },
  { code: "V", label: "Vacation", color: "bg-purple-500", description: "Student on vacation, not charged" },
  { code: "C", label: "Closed", color: "bg-destructive", description: "Mess closed/holiday, not charged" },
]

export function AttendanceLegend() {
  return (
    <Card className="p-4 border-border/60 shadow-sm bg-muted/20">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        Attendance Codes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {attendanceCodes.map((item) => (
          <div key={item.code} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div
              className={`min-w-6 w-6 h-6 rounded ${item.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
            >
              {item.code}
            </div>
            <div>
              <div className="font-medium text-sm text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground leading-tight">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

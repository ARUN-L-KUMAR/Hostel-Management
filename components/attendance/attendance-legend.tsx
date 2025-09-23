import { Card } from "@/components/ui/card"

const attendanceCodes = [
  { code: "P", label: "Present", color: "bg-green-500", description: "Student was present and had meals" },
  { code: "L", label: "Leave", color: "bg-yellow-500", description: "Student on leave but charged" },
  { code: "CN", label: "Concession", color: "bg-blue-500", description: "Student on concession, not charged" },
  { code: "V", label: "Vacation", color: "bg-gray-500", description: "Student on vacation, not charged" },
  { code: "C", label: "Closed", color: "bg-red-500", description: "Mess closed/holiday, not charged" },
]

export function AttendanceLegend() {
  return (
    <Card className="p-4 border-0 shadow-md">
      <h3 className="font-semibold text-slate-900 mb-3">Attendance Codes</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {attendanceCodes.map((item) => (
          <div key={item.code} className="flex items-center space-x-3">
            <div
              className={`w-6 h-6 rounded ${item.color} flex items-center justify-center text-white text-xs font-bold`}
            >
              {item.code}
            </div>
            <div>
              <div className="font-medium text-sm text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-500">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

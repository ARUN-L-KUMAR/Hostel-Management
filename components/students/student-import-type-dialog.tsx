"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Crown } from "lucide-react"

interface StudentImportTypeDialogProps {
  onSelectRegular: () => void
  onSelectMando: () => void
  onClose: () => void
}

export function StudentImportTypeDialog({ onSelectRegular, onSelectMando, onClose }: StudentImportTypeDialogProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Select Student Type</h2>
        <p className="text-slate-600">Choose the type of students you want to import</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Regular Students Option */}
        <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
              onClick={onSelectRegular}>
          <div className="text-center space-y-4">
            <Users className="w-12 h-12 text-blue-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-slate-900">Regular Students</h3>
              <p className="text-sm text-slate-600 mt-1">
                Import regular hostel students with standard billing and meal tracking
              </p>
            </div>
            <Button className="w-full">
              Import Regular Students
            </Button>
          </div>
        </Card>

        {/* Mando Students Option */}
        <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-300"
              onClick={onSelectMando}>
          <div className="text-center space-y-4">
            <Crown className="w-12 h-12 text-purple-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-slate-900">Mando Students</h3>
              <p className="text-sm text-slate-600 mt-1">
                Import mando students with special privileges and meal tracking
              </p>
            </div>
            <Button className="w-full" variant="secondary">
              Import Mando Students
            </Button>
          </div>
        </Card>
      </div>

      {/* Cancel Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
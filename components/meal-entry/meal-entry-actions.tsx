"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Download, Upload } from "lucide-react"
import { MandoStudentImportDialog } from "@/components/meal-entry/mando-student-import-dialog"

interface MealEntryActionsProps {
  onExport?: () => void
}

export function MealEntryActions({ onExport }: MealEntryActionsProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleImport = () => {
    setImportDialogOpen(true)
  }

  return (
    <div className="flex items-center space-x-2">
      {onExport && (
        <Button variant="outline" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      )}
    </div>
  )
}
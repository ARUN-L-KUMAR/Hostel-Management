"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Download, Upload } from "lucide-react"
import { AddStudentDialog } from "./add-student-dialog"

export function StudentsActions() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const handleExport = () => {
    console.log("[v0] Exporting students data")
    // This would generate and download a CSV/Excel file
  }

  const handleImport = () => {
    console.log("[v0] Importing students data")
    // This would open an import dialog
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      <Button variant="outline" onClick={handleImport}>
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <AddStudentDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

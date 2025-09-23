"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Download, Upload } from "lucide-react"
import { AddStudentDialog } from "./add-student-dialog"
import { ExcelImportDialog } from "./excel-import-dialog"

export function StudentsActions() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleExport = () => {
    console.log("[v0] Exporting students data")
    // This would generate and download a CSV/Excel file
  }

  const handleImport = () => {
    setImportDialogOpen(true)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Import Students from Excel</DialogTitle>
          </DialogHeader>
          <ExcelImportDialog onClose={() => setImportDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <AddStudentDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

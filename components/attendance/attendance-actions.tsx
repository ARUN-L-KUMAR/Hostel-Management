"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Download } from "lucide-react"
import { ExcelImportDialog } from "./excel-import-dialog"

export function AttendanceActions() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleExportExcel = () => {
    console.log("[v0] Exporting attendance to Excel")
    // This would generate and download an Excel file
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handleExportExcel}>
        <Download className="w-4 h-4 mr-2" />
        Export Excel
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Attendance from Excel</DialogTitle>
          </DialogHeader>
          <ExcelImportDialog onClose={() => setImportDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

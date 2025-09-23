"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Download, Upload, TrendingUp } from "lucide-react"
import { ProvisionsExcelImportDialog } from "./excel-import-dialog"

export function ProvisionsActions() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleExport = () => {
    console.log("[v0] Exporting provisions data")
  }

  const handleImport = () => {
    setImportDialogOpen(true)
  }

  const handleAnalytics = () => {
    console.log("[v0] Opening provisions analytics")
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handleAnalytics}>
        <TrendingUp className="w-4 h-4 mr-2" />
        Analytics
      </Button>

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
            <DialogTitle>Import Provisions from Excel</DialogTitle>
          </DialogHeader>
          <ProvisionsExcelImportDialog onClose={() => setImportDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Add Provision Item</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-slate-600">Add provision item dialog would go here...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

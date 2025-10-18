"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Download, Upload, RefreshCw } from "lucide-react"
import { ProvisionsExcelImportDialog } from "./excel-import-dialog"
import { AddProvisionDialog } from "./add-provision-dialog"

interface ProvisionsActionsProps {
  onRefresh?: () => void
}

export function ProvisionsActions({ onRefresh }: ProvisionsActionsProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleExport = () => {
    console.log("[v0] Exporting provisions data")
  }

  const handleImport = () => {
    setImportDialogOpen(true)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
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

      <Button onClick={() => setAddDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>

      <AddProvisionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => onRefresh?.()}
      />
    </div>
  )
}

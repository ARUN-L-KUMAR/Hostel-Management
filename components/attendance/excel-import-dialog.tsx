"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Upload, FileSpreadsheet } from "lucide-react"

interface ExcelImportDialogProps {
  onClose: () => void
}

export function ExcelImportDialog({ onClose }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    stats?: {
      totalRows: number
      successfulRows: number
      failedRows: number
      warnings: string[]
    }
  } | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)

    // Simulate import process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock import result
    setImportResult({
      success: true,
      message: "Import completed successfully",
      stats: {
        totalRows: 50,
        successfulRows: 47,
        failedRows: 3,
        warnings: [
          "Student 'John Doe' (B21999) not found in database",
          "Invalid date format in row 15",
          "Duplicate entry for 'Jane Smith' on 2024-12-15",
        ],
      },
    })

    setImporting(false)
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card className="p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/5">
        <div className="text-center">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Upload Excel File</h3>
            <p className="text-sm text-muted-foreground">Select the Boys Mandays Excel file with attendance data</p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="excel-file" />
            <label htmlFor="excel-file">
              <Button variant="outline" className="cursor-pointer bg-background" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </span>
              </Button>
            </label>
            {file && <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-2 font-medium">Selected: {file.name}</p>}
          </div>
        </div>
      </Card>

      {/* Import Instructions */}
      <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
        <AlertTriangle className="h-4 w-4 stroke-amber-500" />
        <AlertDescription>
          <strong className="text-amber-700 dark:text-amber-400">Excel Format Requirements:</strong>
          <ul className="mt-2 space-y-1 text-sm text-amber-700/80 dark:text-amber-400/80">
            <li>• First row should contain student names or roll numbers</li>
            <li>• Columns should represent days of the month (1-31)</li>
            <li>• Use codes: P (Present), L (Leave), CN (Concession), V (Vacation), C (Closed)</li>
            <li>• Empty cells will be treated as absent</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Import Progress */}
      {importing && (
        <Card className="p-4 border-border/60 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm font-medium text-foreground">Importing attendance data...</span>
            </div>
            <Progress value={65} className="w-full h-2" />
            <p className="text-xs text-muted-foreground">Processing rows and validating data...</p>
          </div>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card className="p-4 border-border/60 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              )}
              <span className={`font-medium ${importResult.success ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
                {importResult.message}
              </span>
            </div>

            {importResult.stats && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="font-semibold text-foreground text-lg">{importResult.stats.totalRows}</div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wider">Total Rows</div>
                  </div>
                  <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-500 text-lg">{importResult.stats.successfulRows}</div>
                    <div className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Successful</div>
                  </div>
                  <div className="text-center p-2 bg-destructive/10 rounded-lg">
                    <div className="font-semibold text-destructive text-lg">{importResult.stats.failedRows}</div>
                    <div className="text-destructive text-xs uppercase tracking-wider">Failed</div>
                  </div>
                </div>

                {importResult.stats.warnings.length > 0 && (
                  <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                    <h4 className="font-medium text-amber-700 dark:text-amber-500 mb-2 text-sm">Warnings:</h4>
                    <ul className="space-y-1 text-sm text-amber-600/90 dark:text-amber-400/90">
                      {importResult.stats.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!file || importing}>
          {importing ? "Importing..." : "Import Attendance"}
        </Button>
      </div>
    </div>
  )
}

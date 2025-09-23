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
      <Card className="p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
        <div className="text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <div className="space-y-2">
            <h3 className="font-medium text-slate-900">Upload Excel File</h3>
            <p className="text-sm text-slate-600">Select the Boys Mandays Excel file with attendance data</p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="excel-file" />
            <label htmlFor="excel-file">
              <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </span>
              </Button>
            </label>
            {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
          </div>
        </div>
      </Card>

      {/* Import Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Excel Format Requirements:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• First row should contain student names or roll numbers</li>
            <li>• Columns should represent days of the month (1-31)</li>
            <li>• Use codes: P (Present), L (Leave), CN (Concession), V (Vacation), C (Closed)</li>
            <li>• Empty cells will be treated as absent</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Import Progress */}
      {importing && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Importing attendance data...</span>
            </div>
            <Progress value={65} className="w-full" />
            <p className="text-xs text-slate-600">Processing rows and validating data...</p>
          </div>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${importResult.success ? "text-green-800" : "text-red-800"}`}>
                {importResult.message}
              </span>
            </div>

            {importResult.stats && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{importResult.stats.totalRows}</div>
                    <div className="text-slate-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{importResult.stats.successfulRows}</div>
                    <div className="text-slate-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{importResult.stats.failedRows}</div>
                    <div className="text-slate-600">Failed</div>
                  </div>
                </div>

                {importResult.stats.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Warnings:</h4>
                    <ul className="space-y-1 text-sm text-orange-700">
                      {importResult.stats.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
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
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!file || importing}>
          {importing ? "Importing..." : "Import Attendance"}
        </Button>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Upload, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import { generateUniqueRollNumber, ensureUniqueRollNumber, processStudentImportData, validateStudentImportData } from "@/lib/utils"

interface ExcelImportDialogProps {
  onClose: () => void
  onImportMore?: () => void
  importOptions?: {
    gender: 'boys' | 'girls'
    importType: 'batch' | 'separate'
    year?: number
    studentType?: 'regular' | 'mando'
  }
}

export function ExcelImportDialog({ onClose, onImportMore, importOptions }: ExcelImportDialogProps) {
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
    if (!file || !importOptions) return

    setImporting(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })

      // Use the utility function to process student data
      const { students: allStudents, warnings } = processStudentImportData(workbook, importOptions, XLSX)

      // Validate the processed data
      const validation = validateStudentImportData(allStudents)
      if (!validation.isValid) {
        setImportResult({
          success: false,
          message: "Data validation failed",
          stats: {
            totalRows: allStudents.length,
            successfulRows: 0,
            failedRows: allStudents.length,
            warnings: [...warnings, ...validation.errors]
          }
        })
        setImporting(false)
        return
      }

      if (allStudents.length === 0) {
        setImportResult({
          success: false,
          message: "No valid student data found in the Excel file",
          stats: {
            totalRows: 0,
            successfulRows: 0,
            failedRows: 0,
            warnings
          }
        })
        setImporting(false)
        return
      }

      // Send to API
      const response = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: allStudents }),
      })

      const result = await response.json()

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || "Students imported successfully",
          stats: {
            totalRows: allStudents.length,
            successfulRows: result.successfulCount || allStudents.length,
            failedRows: result.failedCount || 0,
            warnings: [...warnings, ...(result.warnings || [])]
          }
        })
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed",
          stats: {
            totalRows: allStudents.length,
            successfulRows: 0,
            failedRows: allStudents.length,
            warnings
          }
        })
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        message: "Failed to process Excel file",
        stats: {
          totalRows: 0,
          successfulRows: 0,
          failedRows: 0,
          warnings: ["Error reading Excel file"]
        }
      })
    }

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
            <p className="text-sm text-slate-600">Select the Students Excel file with student data across multiple sheets</p>
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
            <li>• {importOptions?.importType === 'batch' ? 'Multiple sheets named "first", "second", "third", "final"' : `Single sheet for ${importOptions?.year === 1 ? 'First' : importOptions?.year === 2 ? 'Second' : importOptions?.year === 3 ? 'Third' : 'Final'} Year`}</li>
            <li>• Header row with columns: "S.No", "Name", "Dept", "Register No" (case-insensitive)</li>
            <li>• Headers can be in any row; data starts from the next row</li>
            <li>• Gender: {importOptions?.gender === 'girls' ? 'Girls hostel + Female gender' : 'Boys hostel + Male gender'}</li>
            <li>• Register No column will be used as roll number if present, otherwise auto-generated</li>
            <li>• Year is determined from import selection (not from Excel column)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Import Progress */}
      {importing && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Importing student data...</span>
            </div>
            <Progress value={65} className="w-full" />
            <p className="text-xs text-slate-600">Processing sheets and validating data...</p>
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
        {!importResult?.success && (
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? "Importing..." : "Import Students"}
          </Button>
        )}
        {importResult?.success && (
          <Button variant="outline" onClick={onImportMore || (() => {
            setFile(null)
            setImportResult(null)
            // Reset file input
            const fileInput = document.getElementById('excel-file') as HTMLInputElement
            if (fileInput) fileInput.value = ''
          })}>
            Import More Students
          </Button>
        )}
      </div>
    </div>
  )
}
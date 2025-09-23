"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Upload, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

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

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })

      // Determine hostel type from filename
      const fileName = file.name.toLowerCase()
      const isGirlsHostel = fileName.includes('girl') || fileName.includes('g ')
      const hostelPrefix = isGirlsHostel ? 'G' : 'B'
      const hostelId = isGirlsHostel ? 'hostel_girls' : 'hostel_boys'

      const allStudents: any[] = []
      const warnings: string[] = []

      // Process each sheet (1st Year, 2nd Year, etc.)
      workbook.SheetNames.forEach(sheetName => {
        console.log(`Processing sheet: ${sheetName}`)
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          warnings.push(`Sheet "${sheetName}": No data found`)
          return
        }

        // Determine year from sheet name
        let year: number
        const yearMatch = sheetName.match(/(\d+)(?:st|nd|rd|th)\s*year/i)
        if (yearMatch) {
          year = parseInt(yearMatch[1])
        } else if (sheetName.match(/sheet\s*(\d+)/i)) {
          // Handle "Sheet1", "Sheet2", etc.
          const sheetMatch = sheetName.match(/sheet\s*(\d+)/i)
          year = parseInt(sheetMatch![1])
        } else {
          warnings.push(`Sheet "${sheetName}": Cannot determine year from sheet name. Using default year 1.`)
          year = 1 // Default fallback
        }

        // Try to find headers, but be more lenient
        let headerRowIndex = 0 // Assume first row is headers
        let headers: string[] = []

        // Look for a row that has at least "name" in it
        for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
          const row = jsonData[i] as string[]
          if (row && row.length >= 2) {
            const rowStr = row.map(h => h?.toString().toLowerCase().trim()).join(' ')
            if (rowStr.includes('name')) {
              headerRowIndex = i
              headers = row
              break
            }
          }
        }

        if (!headers.length) {
          headers = jsonData[0] as string[] // Fallback to first row
        }

        // Map column indices (case-insensitive, more flexible)
        const columnMap: { [key: string]: number } = {}
        headers.forEach((header, index) => {
          const headerStr = header?.toString().toLowerCase().trim()
          if (headerStr && (headerStr.includes('s.no') || headerStr.includes('serial') || headerStr.includes('roll') || headerStr === 'sno')) {
            columnMap.sNo = index
          } else if (headerStr && (headerStr.includes('name') || headerStr === 'name')) {
            columnMap.name = index
          }
        })

        // If we can't find columns, assume first two columns are S.No and Name
        if (columnMap.sNo === undefined) {
          columnMap.sNo = 0
          warnings.push(`Sheet "${sheetName}": Could not find S.No column, assuming column 1`)
        }
        if (columnMap.name === undefined) {
          columnMap.name = 1
          warnings.push(`Sheet "${sheetName}": Could not find Name column, assuming column 2`)
        }

        // Process data rows (start from row after header)
        let studentCounter = 1
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[]
          if (!row || row.length <= Math.max(columnMap.sNo, columnMap.name)) continue

          const sNo = row[columnMap.sNo]?.toString().trim()
          const name = row[columnMap.name]?.toString().trim()

          if (!sNo || !name || sNo === '' || name === '') {
            continue // Skip empty rows silently
          }

          // Generate unique roll number based on year and counter
          // Format: [Year][Hostel][Counter] e.g., 1B001, 2B001, 1G001
          const rollNo = `${year}${hostelPrefix}${studentCounter.toString().padStart(3, '0')}`

          // Determine hostel from roll number (second character)
          const hostelFromRoll = rollNo.charAt(1).toUpperCase()
          const finalHostelId = hostelFromRoll === 'G' ? 'hostel_girls' : 'hostel_boys'

          allStudents.push({
            name,
            rollNo,
            year,
            hostelId: finalHostelId,
            isMando: false, // Default to false, can be updated later
          })

          studentCounter++
        }

        console.log(`Sheet "${sheetName}": Processed ${jsonData.length - headerRowIndex - 1} rows, added ${allStudents.length} students so far`)
      })

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
            <li>• Multiple sheets named "1st Year", "2nd Year", "3rd Year", "4th Year" or "Sheet1", "Sheet2", "Sheet3", "Sheet4"</li>
            <li>• Header row with columns: "S.No", "Name", "Room No", "Dept" (case-insensitive)</li>
            <li>• Headers can be in any row; data starts from the next row</li>
            <li>• Hostel detected from filename: "girls" → Girls hostel (G prefix), otherwise Boys hostel (B prefix)</li>
            <li>• Roll numbers auto-generated (e.g., 1B001, 1G001) with hostel determined by 2nd character</li>
            <li>• Room No and Dept columns are ignored</li>
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
        <Button onClick={handleImport} disabled={!file || importing}>
          {importing ? "Importing..." : "Import Students"}
        </Button>
      </div>
    </div>
  )
}
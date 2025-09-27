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

export function ProvisionsExcelImportDialog({ onClose }: ExcelImportDialogProps) {
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

      const allProvisions: any[] = []
      const warnings: string[] = []

      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        console.log(`Processing sheet: ${sheetName}`)
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          warnings.push(`Sheet "${sheetName}": No data found`)
          return
        }

        // Find the header row
        let headerRowIndex = 0
        let headers: string[] = []

        // Look for a row that has "items" or similar
        for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
          const row = jsonData[i] as string[]
          if (row && row.length >= 2) {
            const rowStr = row.map(h => h?.toString().toLowerCase().trim()).join(' ')
            if (rowStr.includes('item') || rowStr.includes('பொருள்') || rowStr.includes('பொருட்கள்')) {
              headerRowIndex = i
              headers = row
              break
            }
          }
        }

        if (!headers.length) {
          headers = jsonData[0] as string[] // Fallback to first row
        }

        // Map column indices
        const columnMap: { [key: string]: number } = {}
        headers.forEach((header, index) => {
          const headerStr = header?.toString().toLowerCase().trim()
          if (headerStr && (headerStr.includes('s.no') || headerStr.includes('serial') || headerStr === 'sno' || headerStr === 's.no')) {
            columnMap.sNo = index
          } else if (headerStr && (headerStr === 'items' || headerStr === 'item' || headerStr.includes('பொருள்') || headerStr.includes('பொருட்கள்'))) {
            columnMap.items = index
          } else if (headerStr && (headerStr === 'unit' || headerStr.includes('unit'))) {
            columnMap.unit = index
          } else if (headerStr && (headerStr === 'quantity' || headerStr === 'qty' || headerStr.includes('quantity'))) {
            columnMap.quantity = index
          } else if (headerStr && (headerStr === 'cost' || headerStr === 'unit cost' || headerStr === 'unitcost' || headerStr.includes('cost'))) {
            columnMap.cost = index
          }
        })

        // If we can't find columns, assume positions
        if (columnMap.sNo === undefined) {
          columnMap.sNo = 0
          warnings.push(`Sheet "${sheetName}": Could not find S.No column, assuming column 1`)
        }
        if (columnMap.items === undefined) {
          columnMap.items = 1
          warnings.push(`Sheet "${sheetName}": Could not find Items column, assuming column 2`)
        }
        if (columnMap.unit === undefined) {
          columnMap.unit = 2
          warnings.push(`Sheet "${sheetName}": Could not find Unit column, assuming column 3`)
        }
        if (columnMap.quantity === undefined) {
          columnMap.quantity = 3
          warnings.push(`Sheet "${sheetName}": Could not find Quantity column, assuming column 4`)
        }
        if (columnMap.cost === undefined) {
          columnMap.cost = 4
          warnings.push(`Sheet "${sheetName}": Could not find Cost column, assuming column 5`)
        }

        // Process data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[]
          if (!row || row.length <= Math.max(columnMap.sNo, columnMap.items)) continue

          const sNo = row[columnMap.sNo]?.toString().trim()
          const items = row[columnMap.items]?.toString().trim()
          const unit = row[columnMap.unit]?.toString().trim() || 'kg'
          const quantity = row[columnMap.quantity]?.toString().trim() || '1'
          const cost = parseFloat(row[columnMap.cost]?.toString().trim()) || 0

          if (!items || items === '') {
            continue // Skip empty rows silently
          }

          allProvisions.push({
            name: items,
            unit: unit.toLowerCase(),
            unitCost: cost,
            unitMeasure: `${quantity} ${unit.toLowerCase()}`
          })
        }

        console.log(`Sheet "${sheetName}": Processed ${jsonData.length - headerRowIndex - 1} rows, added ${allProvisions.length} provisions so far`)
      })

      if (allProvisions.length === 0) {
        setImportResult({
          success: false,
          message: "No valid provision data found in the Excel file",
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
      const response = await fetch('/api/provisions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provisions: allProvisions }),
      })

      const result = await response.json()

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || "Provisions imported successfully",
          stats: {
            totalRows: allProvisions.length,
            successfulRows: result.successfulCount || allProvisions.length,
            failedRows: result.failedCount || 0,
            warnings: [...warnings, ...(result.warnings || [])]
          }
        })
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed",
          stats: {
            totalRows: allProvisions.length,
            successfulRows: 0,
            failedRows: allProvisions.length,
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
            <p className="text-sm text-slate-600">Select the Provisions Excel file with provision items</p>
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
            <li>• Header row with columns: S.No, Items, Unit, Quantity, Cost</li>
            <li>• Items column can contain text (including Tamil)</li>
            <li>• Headers can be in any row; data starts from the next row</li>
            <li>• Unit column is optional (defaults to 'kg')</li>
            <li>• Quantity column specifies the amount per unit (e.g., 1, 500, 2.5)</li>
            <li>• Cost column specifies the unit cost (numeric value)</li>
            <li>• Duplicate items will be skipped</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Import Progress */}
      {importing && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Importing provision data...</span>
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
          {importing ? "Importing..." : "Import Provisions"}
        </Button>
      </div>
    </div>
  )
}
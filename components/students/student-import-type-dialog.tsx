"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, Crown } from "lucide-react"

interface StudentImportTypeDialogProps {
  onSelectRegular: () => void
  onSelectMando: () => void
  onSelectImport: (options: { gender: 'boys' | 'girls', importType: 'batch' | 'separate', year?: number, studentType: 'regular' | 'mando' }) => void
  onClose: () => void
}

export function StudentImportTypeDialog({ onSelectRegular, onSelectMando, onSelectImport, onClose }: StudentImportTypeDialogProps) {
  const [gender, setGender] = useState<'boys' | 'girls'>('boys')
  const [importType, setImportType] = useState<'batch' | 'separate'>('batch')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [studentType, setStudentType] = useState<'regular' | 'mando'>('regular')

  const handleProceed = () => {
    if (importType === 'separate' && !selectedYear) {
      return // Don't proceed if separate is selected but no year chosen
    }

    onSelectImport({
      gender,
      importType,
      year: importType === 'separate' ? selectedYear! : undefined,
      studentType
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Import Student Data</h2>
        <p className="text-slate-600">Configure your student import settings</p>
      </div>

      {/* Student Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-900">Student Type</label>
        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 cursor-pointer transition-all ${studentType === 'regular' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                onClick={() => setStudentType('regular')}>
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-slate-900">Regular</div>
            </div>
          </Card>
          <Card className={`p-4 cursor-pointer transition-all ${studentType === 'mando' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
                onClick={() => setStudentType('mando')}>
            <div className="text-center">
              <Crown className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-slate-900">Mando</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-900">Select Gender</label>
        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 cursor-pointer transition-all ${gender === 'boys' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                onClick={() => setGender('boys')}>
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-slate-900">Boys</div>
            </div>
          </Card>
          <Card className={`p-4 cursor-pointer transition-all ${gender === 'girls' ? 'border-pink-500 bg-pink-50' : 'border-slate-200'}`}
                onClick={() => setGender('girls')}>
            <div className="text-center">
              <Crown className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="font-medium text-slate-900">Girls</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Import Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-900">Import Type</label>
        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 cursor-pointer transition-all ${importType === 'batch' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
                onClick={() => setImportType('batch')}>
            <div className="text-center">
              <div className="font-medium text-slate-900 mb-1">Batch Import</div>
              <div className="text-xs text-slate-600">All years in single sheet</div>
            </div>
          </Card>
          <Card className={`p-4 cursor-pointer transition-all ${importType === 'separate' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}
                onClick={() => setImportType('separate')}>
            <div className="text-center">
              <div className="font-medium text-slate-900 mb-1">Separate Import</div>
              <div className="text-xs text-slate-600">Import specific year</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Year Selection for Separate Import */}
      {importType === 'separate' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900">Select Year</label>
          <Select value={selectedYear?.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">First Year</SelectItem>
              <SelectItem value="2">Second Year</SelectItem>
              <SelectItem value="3">Third Year</SelectItem>
              <SelectItem value="4">Final Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Warning for Batch Import */}
      {importType === 'batch' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Batch Import Warning:</strong> Ensure your Excel file has sub-sheets named exactly as "first", "second", "third", and "final" for each year respectively.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleProceed}
          disabled={importType === 'separate' && !selectedYear}
        >
          Proceed to Import
        </Button>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Users, Crown, Info, X } from "lucide-react"
import * as XLSX from "xlsx"
import { processStudentImportData, validateStudentImportData } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ImportStudentsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

type StudentType = 'regular' | 'mando'
type Gender = 'boys' | 'girls'
type ImportMode = 'batch' | 'separate'

export function ImportStudentsDialog({ open, onOpenChange, onSuccess }: ImportStudentsDialogProps) {
    const [studentType, setStudentType] = useState<StudentType>('regular')
    const [gender, setGender] = useState<Gender>('boys')
    const [importMode, setImportMode] = useState<ImportMode>('batch')
    const [year, setYear] = useState<string>("1")

    const [file, setFile] = useState<File | null>(null)
    const [isImporting, setIsImporting] = useState(false)
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
            setImportResult(null)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.files?.[0]) {
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile)
                setImportResult(null)
            }
        }
    }

    const handleImport = async () => {
        if (!file) return

        setIsImporting(true)
        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data, { type: 'array' })

            const importOptions = {
                gender,
                importType: importMode,
                year: importMode === 'separate' ? parseInt(year) : undefined,
                studentType
            }

            // Process Data
            const { students: allStudents, warnings } = processStudentImportData(workbook, importOptions, XLSX)

            // Validate Data
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
                setIsImporting(false)
                return
            }

            if (allStudents.length === 0) {
                setImportResult({
                    success: false,
                    message: "No valid student data found",
                    stats: {
                        totalRows: 0,
                        successfulRows: 0,
                        failedRows: 0,
                        warnings: [...warnings, "Ensure sheet names match requirements"]
                    }
                })
                setIsImporting(false)
                return
            }

            // Send to API
            const response = await fetch('/api/students/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: allStudents }),
            })

            const result = await response.json()

            if (response.ok) {
                setImportResult({
                    success: true,
                    message: result.message || "Import successful",
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
            console.error("Import error:", error)
            setImportResult({
                success: false,
                message: "Failed to process file",
                stats: {
                    totalRows: 0,
                    successfulRows: 0,
                    failedRows: 0,
                    warnings: ["Error reading Excel file. Ensure valid format."]
                }
            })
        } finally {
            setIsImporting(false)
        }
    }

    const resetState = () => {
        setFile(null)
        setImportResult(null)
        setImportMode('batch')
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetState()
            onOpenChange(val)
        }}>
            <DialogContent className="max-w-3xl bg-white p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <FileSpreadsheet className="size-5 text-primary" />
                        Import Students
                    </DialogTitle>
                    <DialogDescription>
                        Bulk upload student data via Excel
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 h-[500px]">
                    {/* Left Panel: Options */}
                    <div className="p-6 pt-2 border-r bg-muted/10 space-y-6 overflow-y-auto">

                        {/* Student Type */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Type</Label>
                            <Tabs value={studentType} onValueChange={(v) => setStudentType(v as StudentType)} className="w-full">
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="regular" className="text-xs">Regular</TabsTrigger>
                                    <TabsTrigger value="mando" className="text-xs">Mando</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Gender */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hostel / Gender</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    className={cn(
                                        "cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:bg-muted",
                                        gender === 'boys' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                    )}
                                    onClick={() => setGender('boys')}
                                >
                                    <Users className={cn("size-6", gender === 'boys' ? "text-primary" : "text-muted-foreground")} />
                                    <span className="text-xs font-medium">Boys</span>
                                </div>
                                <div
                                    className={cn(
                                        "cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:bg-muted",
                                        gender === 'girls' ? "border-pink-500 bg-pink-50 ring-1 ring-pink-500" : "border-border"
                                    )}
                                    onClick={() => setGender('girls')}
                                >
                                    <Crown className={cn("size-6", gender === 'girls' ? "text-pink-500" : "text-muted-foreground")} />
                                    <span className="text-xs font-medium">Girls</span>
                                </div>
                            </div>
                        </div>

                        {/* Import Mode */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Import Mode</Label>
                            <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)} className="flex flex-col gap-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="batch" id="batch" />
                                    <Label htmlFor="batch" className="font-normal cursor-pointer">Batch Import (All Years)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="separate" id="separate" />
                                    <Label htmlFor="separate" className="font-normal cursor-pointer">Single Year</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {importMode === 'separate' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label className="text-xs">Select Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st Year</SelectItem>
                                        <SelectItem value="2">2nd Year</SelectItem>
                                        <SelectItem value="3">3rd Year</SelectItem>
                                        <SelectItem value="4">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Upload & Status */}
                    <div className="md:col-span-2 p-6 pt-2 flex flex-col h-full overflow-hidden">

                        {!importResult ? (
                            <div className="flex-1 flex flex-col gap-6">

                                {/* Requirements Info */}
                                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                                    <Info className="size-4 text-blue-600" />
                                    <AlertTitle className="text-sm font-semibold text-blue-900 mb-1">File Requirements</AlertTitle>
                                    <AlertDescription className="text-xs space-y-2">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <div>
                                                <span className="font-semibold">Required Columns:</span>
                                                <p className="text-blue-700">S.No, Name, Dept, Register No</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Sheet Names:</span>
                                                <p className="text-blue-700">
                                                    {importMode === 'batch'
                                                        ? '"first", "second", "third", "final"'
                                                        : `Contains "${year === '1' ? 'first' : year === '2' ? 'second' : year === '3' ? 'third' : 'final'}"`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>

                                {/* Dropzone */}
                                <div
                                    className={cn(
                                        "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-all bg-muted/5",
                                        file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/10 cursor-pointer"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <input id="file-upload" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />

                                    {file ? (
                                        <div className="text-center p-4">
                                            <FileSpreadsheet className="size-12 text-primary mx-auto mb-2" />
                                            <p className="font-medium text-foreground">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                            <Button variant="ghost" size="sm" className="mt-2 text-destructive hover:text-destructive" onClick={(e) => {
                                                e.stopPropagation()
                                                setFile(null)
                                            }}>
                                                Remove File
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-3">
                                                <Upload className="size-6 text-primary" />
                                            </div>
                                            <p className="font-medium text-foreground">Click to upload or drag & drop</p>
                                            <p className="text-xs text-muted-foreground mt-1">Excel files (.xlsx, .xls) only</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                                    <Button onClick={handleImport} disabled={!file || isImporting}>
                                        {isImporting ? (
                                            <>
                                                <div className="animate-spin rounded-full size-4 border-b-2 border-white mr-2" />
                                                Importing...
                                            </>
                                        ) : "Start Import"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full">
                                <div className="flex flex-col items-center justify-center p-8 text-center flex-shrink-0">
                                    {importResult.success ? (
                                        <div className="bg-green-100 p-3 rounded-full mb-3">
                                            <CheckCircle className="size-8 text-green-600" />
                                        </div>
                                    ) : (
                                        <div className="bg-red-100 p-3 rounded-full mb-3">
                                            <AlertTriangle className="size-8 text-red-600" />
                                        </div>
                                    )}
                                    <h3 className="text-lg font-semibold">{importResult.message}</h3>
                                    {importResult.success && <p className="text-sm text-muted-foreground mt-1">Data has been successfully added to the database.</p>}
                                </div>

                                {importResult.stats && (
                                    <ScrollArea className="flex-1 bg-muted/20 border rounded-lg p-4">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div className="bg-white p-3 rounded border">
                                                    <div className="text-2xl font-bold">{importResult.stats.totalRows}</div>
                                                    <div className="text-xs text-muted-foreground uppercase">Total</div>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded border border-green-100">
                                                    <div className="text-2xl font-bold text-green-700">{importResult.stats.successfulRows}</div>
                                                    <div className="text-xs text-green-600 uppercase">Success</div>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded border border-red-100">
                                                    <div className="text-2xl font-bold text-red-700">{importResult.stats.failedRows}</div>
                                                    <div className="text-xs text-red-600 uppercase">Failed</div>
                                                </div>
                                            </div>

                                            {importResult.stats.warnings.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-orange-700 uppercase">Issues Found ({importResult.stats.warnings.length})</p>
                                                    <div className="text-xs font-mono bg-orange-50 border border-orange-100 p-2 rounded max-h-[150px] overflow-y-auto">
                                                        {importResult.stats.warnings.map((w, i) => (
                                                            <div key={i} className="mb-1 text-orange-800 border-b border-orange-100/50 pb-1 last:border-0 last:pb-0">
                                                                • {w}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                )}

                                <div className="flex justify-end gap-2 pt-4 mt-auto">
                                    <Button variant="outline" onClick={resetState}>Import More</Button>
                                    <Button onClick={() => { onSuccess(); onOpenChange(false); }}>Done</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Plus, Download, Upload, ArrowUp, Loader2 } from "lucide-react"
import { AddStudentDialog } from "./add-student-dialog"
import { ExcelImportDialog } from "./excel-import-dialog"
import { StudentImportTypeDialog } from "./student-import-type-dialog"
import { MandoStudentImportDialog } from "@/components/meal-entry/mando-student-import-dialog"
import { useToast } from "@/hooks/use-toast"

export function StudentsActions() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importTypeDialogOpen, setImportTypeDialogOpen] = useState(false)
  const [regularImportDialogOpen, setRegularImportDialogOpen] = useState(false)
  const [mandoImportDialogOpen, setMandoImportDialogOpen] = useState(false)
  const [importOptions, setImportOptions] = useState<{ gender: 'boys' | 'girls', importType: 'batch' | 'separate', year?: number, studentType?: 'regular' | 'mando' } | null>(null)
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [promoteProgress, setPromoteProgress] = useState({ promoted: 0, graduated: 0, mandoPromoted: 0, mandoGraduated: 0, total: 0 })
  const [promoteType, setPromoteType] = useState("both")
  const { toast } = useToast()

  const handleExport = () => {
    console.log("[v0] Exporting students data")
    // This would generate and download a CSV/Excel file
  }

  const handleImport = () => {
    setImportTypeDialogOpen(true)
  }

  const handleSelectImport = (options: { gender: 'boys' | 'girls', importType: 'batch' | 'separate', year?: number, studentType: 'regular' | 'mando' }) => {
    setImportOptions(options)
    setImportTypeDialogOpen(false)
    if (options.studentType === 'mando') {
      setMandoImportDialogOpen(true)
    } else {
      setRegularImportDialogOpen(true)
    }
  }


  const handlePromoteStudents = async () => {
    setIsPromoting(true)
    setPromoteProgress({ promoted: 0, graduated: 0, mandoPromoted: 0, mandoGraduated: 0, total: 0 })

    try {
      const response = await fetch('/api/students/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promoteType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to promote students')
      }

      const result = await response.json()
      setPromoteProgress({
        promoted: result.promotedCount,
        graduated: result.graduatedCount,
        mandoPromoted: result.mandoPromotedCount,
        mandoGraduated: result.mandoGraduatedCount,
        total: result.promotedCount + result.graduatedCount
      })

      toast({
        title: "Success",
        description: result.message,
      })

      // Close dialog and refresh after a short delay
      setTimeout(() => {
        setPromoteDialogOpen(false)
        setIsPromoting(false)
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('Error promoting students:', error)
      toast({
        title: "Error",
        description: "Failed to promote students. Please try again.",
        variant: "destructive",
      })
      setIsPromoting(false)
      setPromoteDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      {/* Import Type Selection Dialog */}
      <Dialog open={importTypeDialogOpen} onOpenChange={setImportTypeDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Select Import Type</DialogTitle>
          </DialogHeader>
          <StudentImportTypeDialog
            onSelectImport={handleSelectImport}
            onClose={() => setImportTypeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Regular Students Import Dialog */}
      <Dialog open={regularImportDialogOpen} onOpenChange={setRegularImportDialogOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Import Regular Students from Excel</DialogTitle>
          </DialogHeader>
          <ExcelImportDialog
            onClose={() => setRegularImportDialogOpen(false)}
            onImportMore={() => {
              setRegularImportDialogOpen(false)
              setImportTypeDialogOpen(true)
            }}
            importOptions={importOptions || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Mando Students Import Dialog */}
      <Dialog open={mandoImportDialogOpen} onOpenChange={setMandoImportDialogOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Import Mando Students from Excel</DialogTitle>
          </DialogHeader>
          <MandoStudentImportDialog onClose={() => setMandoImportDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Promote Students Alert Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isPromoting}>
            {isPromoting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 mr-2" />
            )}
            Promote to Next Year
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPromoting ? "Promoting Students..." : "Promote All Students"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPromoting ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing students...</span>
                  </div>
                  <div className="space-y-2">
                    <Progress value={undefined} className="w-full" />
                    {promoteProgress.total > 0 && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>✓ Promoted: {promoteProgress.promoted} | Graduated: {promoteProgress.graduated}</div>
                        <div className="text-xs">Mando: {promoteProgress.mandoPromoted} promoted, {promoteProgress.mandoGraduated} graduated</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>This will promote selected active students to the next year. 1st, 2nd, and 3rd year students will be advanced by one year. 4th year students will be marked as graduated. This action cannot be undone.</p>

                  <RadioGroup value={promoteType} onValueChange={setPromoteType} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regular" id="promote-regular" />
                      <Label htmlFor="promote-regular" className="text-sm font-medium">
                        Regular Students Only
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mando" id="promote-mando" />
                      <Label htmlFor="promote-mando" className="text-sm font-medium">
                        Mando Students Only
                      </Label>
                    </div>

                    
                  </RadioGroup>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPromoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteStudents} disabled={isPromoting}>
              {isPromoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Promoting...
                </>
              ) : (
                "Promote Students"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <AddStudentDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

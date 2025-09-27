"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserX, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: string
  name: string
  rollNo: string
  dept: string | null
  year: number
  status: string
  hostel: { name: string }
}

interface BulkRemoveDialogProps {
  students: Student[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onStudentsRemoved: () => void
}

export function BulkRemoveDialog({
  students,
  open,
  onOpenChange,
  onStudentsRemoved,
}: BulkRemoveDialogProps) {
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleBulkRemoveStudents = async () => {
    if (!description.trim()) {
      toast.error("Please provide a reason for removing the students")
      return
    }

    if (students.length === 0) {
      toast.error("No students selected")
      return
    }

    setLoading(true)
    try {
      const promises = students.map(student =>
        fetch(`/api/students/${student.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "VACATE",
            leaveDate: new Date().toISOString(),
            leaveReason: description.trim(),
          }),
        })
      )

      const responses = await Promise.all(promises)
      
      // Check if all requests were successful
      const failed = responses.filter(response => !response.ok)
      if (failed.length > 0) {
        throw new Error(`Failed to remove ${failed.length} student(s)`)
      }

      toast.success(`Successfully removed ${students.length} student(s)`)
      onStudentsRemoved()
      onOpenChange(false)
      setDescription("")
    } catch (error) {
      console.error("Error removing students:", error)
      toast.error("Failed to remove some students. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserX className="w-5 h-5" />
            Remove Students (Bulk Vacate)
          </DialogTitle>
          <DialogDescription>
            This action will vacate {students.length} selected student(s) and set their leave date. 
            This action can be reversed by changing the students' status back to active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Students Information Card */}
          <Card className="border-orange-200 bg-orange-50/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-medium text-orange-800">
                    Students to Remove ({students.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between text-sm bg-white rounded px-2 py-1">
                        <div>
                          <span className="font-medium">{student.name}</span>
                          <span className="text-slate-500 ml-2">({student.rollNo})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">{student.dept || 'No Dept'}</span>
                          <Badge variant="outline" className="text-xs">
                            Year {student.year}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Reason for Leaving/Vacating <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide a detailed reason for the students vacating the hostel (e.g., Graduated, Transferred to another college, Personal reasons, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              This reason will be applied to all selected students and recorded for audit purposes.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkRemoveStudents}
            disabled={loading || !description.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Removing..." : `Remove ${students.length} Student(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
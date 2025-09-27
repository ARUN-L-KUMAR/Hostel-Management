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

interface RemoveStudentDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStudentRemoved: () => void
}

export function RemoveStudentDialog({
  student,
  open,
  onOpenChange,
  onStudentRemoved,
}: RemoveStudentDialogProps) {
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRemoveStudent = async () => {
    if (!student || !description.trim()) {
      toast.error("Please provide a reason for removing the student")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "INACTIVE",
          leaveDate: new Date().toISOString(),
          leaveReason: description.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove student")
      }

      toast.success("Student has been successfully removed/vacated")
      onStudentRemoved()
      onOpenChange(false)
      setDescription("")
    } catch (error) {
      console.error("Error removing student:", error)
      toast.error("Failed to remove student. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDescription("")
    onOpenChange(false)
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserX className="w-5 h-5" />
            Remove Student (Vacate)
          </DialogTitle>
          <DialogDescription>
            This action will mark the student as inactive and set their leave date. 
            This action can be reversed by changing the student's status back to active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Information Card */}
          <Card className="border-orange-200 bg-orange-50/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-medium text-orange-800">Student Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">Name:</span>
                      <p className="text-slate-900">{student.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Roll No:</span>
                      <p className="text-slate-900">{student.rollNo}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Department:</span>
                      <p className="text-slate-900">{student.dept || 'Not Set'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Year:</span>
                      <p className="text-slate-900">{student.year}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Hostel:</span>
                      <p className="text-slate-900">{student.hostel?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Current Status:</span>
                      <Badge
                        variant={student.status === "ACTIVE" ? "default" : "secondary"}
                        className={
                          student.status === "ACTIVE" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {student.status}
                      </Badge>
                    </div>
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
              placeholder="Please provide a detailed reason for the student leaving the hostel (e.g., Graduated, Transferred to another college, Personal reasons, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              This information will be recorded for audit purposes.
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
            onClick={handleRemoveStudent}
            disabled={loading || !description.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Removing..." : "Remove Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
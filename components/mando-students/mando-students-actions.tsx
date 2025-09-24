"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { AddMandoStudentDialog } from "@/components/mando-students/add-mando-student-dialog"

export function MandoStudentsActions() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Mando Student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Add New Mando Student</DialogTitle>
          </DialogHeader>
          <AddMandoStudentDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
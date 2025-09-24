"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ApiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface AddMandoStudentDialogProps {
  onClose: () => void
}

export function AddMandoStudentDialog({ onClose }: AddMandoStudentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    companyId: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await ApiClient.mandoStudents.create(formData)
      toast.success("Mando student added successfully")
      onClose()
    } catch (error) {
      console.error("Error adding mando student:", error)
      toast.error("Failed to add mando student")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name.trim() !== ""

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={formData.companyId}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyId: e.target.value }))}
                placeholder="e.g., Mando group id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Student"}
        </Button>
      </div>
    </form>
  )
}
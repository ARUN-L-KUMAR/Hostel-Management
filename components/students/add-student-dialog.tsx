"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

interface AddStudentDialogProps {
  onClose: () => void
}

export function AddStudentDialog({ onClose }: AddStudentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    dept: "",
    year: "",
    hostel: "",
    isMando: false,
    status: "ACTIVE",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          rollNumber: formData.rollNo,
          dept: formData.dept,
          hostel: formData.hostel,
          year: formData.year,
          isMando: formData.isMando,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create student')
      }

      const newStudent = await response.json()
      console.log("[v0] Student created successfully:", newStudent)
      onClose()
    } catch (error) {
      console.error("Error creating student:", error)
      // You could add a toast notification here
      alert(`Failed to create student: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name && formData.rollNo && formData.year && formData.hostel

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="rollNo">Reg Number *</Label>
              <Input
                id="rollNo"
                value={formData.rollNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, rollNo: e.target.value }))}
                placeholder="e.g., B21001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input
                id="dept"
                value={formData.dept}
                onChange={(e) => setFormData((prev) => ({ ...prev, dept: e.target.value }))}
                placeholder="e.g., CSE, ECE, ME"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostel">Hostel *</Label>
              <Select
                value={formData.hostel}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, hostel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys Hostel</SelectItem>
                  <SelectItem value="girls">Girls Hostel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mando Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMando"
                checked={formData.isMando}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isMando: checked === true }))}
              />
              <Label htmlFor="isMando">This is a Mando student</Label>
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

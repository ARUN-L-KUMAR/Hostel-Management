"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

interface AddStudentDialogProps {
  onClose: () => void
}

export function AddStudentDialog({ onClose }: AddStudentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    year: "",
    hostel: "",
    isMando: false,
    company: "",
    status: "ACTIVE",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Adding new student:", formData)
    setIsSubmitting(false)
    onClose()
  }

  const isFormValid = formData.name && formData.rollNo && formData.year && formData.hostel

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Basic Information */}
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
              <Label htmlFor="rollNo">Roll Number *</Label>
              <Input
                id="rollNo"
                value={formData.rollNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, rollNo: e.target.value }))}
                placeholder="e.g., B21001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Academic Year *</Label>
              <Select
                value={formData.year}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
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
              <Switch
                id="isMando"
                checked={formData.isMando}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isMando: checked }))}
              />
              <Label htmlFor="isMando">This is a Mando student</Label>
            </div>

            {formData.isMando && (
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
            )}
          </div>

          {formData.isMando && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-800">
                <strong>Note:</strong> Mando students will have their mess bills covered by the Mando budget and will
                not be charged individually.
              </div>
            </div>
          )}
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

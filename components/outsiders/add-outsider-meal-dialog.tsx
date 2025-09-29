"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ApiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface AddOutsiderMealDialogProps {
  onClose: () => void
}

export function AddOutsiderMealDialog({ onClose }: AddOutsiderMealDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    designation: "",
    description: "",
    date: new Date().toISOString().split('T')[0], // Today's date
    breakfast: false,
    lunch: false,
    dinner: false,
    memberCount: 1,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // First, find or create the outsider
      let outsider
      const existingOutsiders = await ApiClient.outsiders.getAll({ search: formData.name })
      outsider = existingOutsiders.find((o: any) => o.name.toLowerCase() === formData.name.toLowerCase())

      if (!outsider) {
        // Create new outsider
        outsider = await ApiClient.outsiders.create({
          name: formData.name,
          phone: formData.phone,
          company: null, // No company needed
          designation: formData.designation,
          description: formData.description,
        })
      }

      // Create meal record
      await fetch('/api/outsider-meal-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outsiderId: outsider.id,
          date: formData.date,
          breakfast: formData.breakfast,
          lunch: formData.lunch,
          dinner: formData.dinner,
          memberCount: formData.memberCount,
        }),
      })

      toast.success("Outsider meal record added successfully")
      onClose()
    } catch (error) {
      console.error("Error adding outsider meal record:", error)
      toast.error("Failed to add outsider meal record")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasMealsSelected = formData.breakfast || formData.lunch || formData.dinner

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
                placeholder="Enter designation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCount">Number of Members</Label>
              <Input
                id="memberCount"
                type="number"
                min="1"
                value={formData.memberCount}
                onChange={(e) => setFormData((prev) => ({ ...prev, memberCount: parseInt(e.target.value) || 1 }))}
                placeholder="1"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Meals</Label>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breakfast"
                  checked={formData.breakfast}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, breakfast: checked as boolean }))
                  }
                />
                <Label htmlFor="breakfast">Breakfast</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lunch"
                  checked={formData.lunch}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, lunch: checked as boolean }))
                  }
                />
                <Label htmlFor="lunch">Lunch</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dinner"
                  checked={formData.dinner}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, dinner: checked as boolean }))
                  }
                />
                <Label htmlFor="dinner">Dinner</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name || !hasMealsSelected || isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Meal Record"}
        </Button>
      </div>
    </form>
  )
}
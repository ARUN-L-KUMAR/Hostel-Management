"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ApiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface AddOutsiderMealDialogProps {
  onClose: () => void
  initialData?: any
}

export function AddOutsiderMealDialog({ onClose, initialData }: AddOutsiderMealDialogProps) {
  const [formData, setFormData] = useState({
    name: initialData?.outsider?.name || "",
    phone: initialData?.outsider?.phone || "",
    designation: initialData?.outsider?.designation || "",
    date: initialData?.date || new Date().toISOString().split('T')[0],
    breakfast: initialData?.breakfast || false,
    lunch: initialData?.lunch || false,
    dinner: initialData?.dinner || false,
    others: initialData?.others ? true : false,
    othersDescription: initialData?.others || "",
    mealRate: initialData?.mealRate || 50,
    memberCount: initialData?.memberCount || 1,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!initialData

  // Fetch default meal rate from settings
  useEffect(() => {
    const fetchDefaultRate = async () => {
      if (!initialData?.mealRate) {
        try {
          const response = await fetch('/api/settings/mando')
          if (response.ok) {
            const settings = await response.json()
            if (settings?.outsiderMealRate) {
              setFormData(prev => ({ ...prev, mealRate: settings.outsiderMealRate }))
            }
          }
        } catch (error) {
          console.error("Error fetching default meal rate:", error)
        }
      }
    }
    fetchDefaultRate()
  }, [initialData?.mealRate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // First, find or create the outsider
      let outsider
      const existingOutsiders = await ApiClient.outsiders.getAll({ search: formData.name })
      outsider = existingOutsiders.find((o: any) => o.name.toLowerCase() === formData.name.toLowerCase())

      if (!outsider) {
        // Create new outsider if name doesn't exist
        outsider = await ApiClient.outsiders.create({
          name: formData.name,
          phone: formData.phone,
          company: null,
          designation: formData.designation,
          description: null, // Removed description field
        })
      }

      // Create/Update meal record
      await fetch('/api/outsider-meal-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id,
          outsiderId: outsider.id,
          date: formData.date,
          breakfast: formData.breakfast,
          lunch: formData.lunch,
          dinner: formData.dinner,
          others: formData.others ? formData.othersDescription : null,
          mealRate: formData.mealRate,
          memberCount: formData.memberCount,
        }),
      })

      toast.success(isEditing ? "Outsider meal record updated" : "Outsider meal record added successfully")
      onClose()
    } catch (error) {
      console.error("Error saving outsider meal record:", error)
      toast.error(isEditing ? "Failed to update outsider meal record" : "Failed to add outsider meal record")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasMealsSelected = formData.breakfast || formData.lunch || formData.dinner || formData.others

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

            <div className="space-y-2">
              <Label htmlFor="mealRate">Unit Cost (₹) *</Label>
              <Input
                id="mealRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.mealRate}
                onChange={(e) => setFormData((prev) => ({ ...prev, mealRate: parseFloat(e.target.value) || 0 }))}
                placeholder="50"
                required
              />
              <p className="text-xs text-muted-foreground">Cost per meal per person</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Meals</Label>
            <div className="flex flex-wrap gap-6">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="others"
                  checked={formData.others}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, others: checked as boolean, othersDescription: checked ? prev.othersDescription : "" }))
                  }
                />
                <Label htmlFor="others">Others</Label>
              </div>
            </div>

            {/* Others description field - shown when others checkbox is checked */}
            {formData.others && (
              <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="othersDescription">Others Description *</Label>
                <Input
                  id="othersDescription"
                  value={formData.othersDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, othersDescription: e.target.value }))}
                  placeholder="Enter meal/item description (e.g., Snacks, Tea, Special Dish)"
                  required={formData.others}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!formData.name || !hasMealsSelected || isSubmitting || (formData.others && !formData.othersDescription)}
        >
          {isSubmitting ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Meal Record" : "Add Meal Record")}
        </Button>
      </div>
    </form>
  )
}
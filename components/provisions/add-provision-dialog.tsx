"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface AddProvisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddProvisionDialog({ open, onOpenChange, onSuccess }: AddProvisionDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    unitCost: "",
    unitMeasure: ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Item name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.unit.trim()) {
      toast({
        title: "Error", 
        description: "Unit is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.unitCost || parseFloat(formData.unitCost) <= 0) {
      toast({
        title: "Error",
        description: "Valid unit cost is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.unitMeasure.trim()) {
      toast({
        title: "Error",
        description: "Quantity(units) is required", 
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await ApiClient.provisions.create({
        name: formData.name.trim(),
        unit: formData.unit.trim(),
        unitCost: parseFloat(formData.unitCost),
        unitMeasure: formData.unitMeasure.trim()
      })

      toast({
        title: "Success",
        description: "Provision item added successfully",
      })

      // Reset form
      setFormData({
        name: "",
        unit: "",
        unitCost: "",
        unitMeasure: ""
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding provision:", error)
      toast({
        title: "Error",
        description: "Failed to add provision item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: "",
      unit: "",
      unitCost: "",
      unitMeasure: ""
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add Provision Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                placeholder="kg, ltr, pcs"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost (₹)</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost}
                onChange={(e) => handleInputChange("unitCost", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitMeasure">Quantity(units)</Label>
            <Input
              id="unitMeasure"
              value={formData.unitMeasure}
              onChange={(e) => handleInputChange("unitMeasure", e.target.value)}
              placeholder="1 kg, 500g, etc."
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
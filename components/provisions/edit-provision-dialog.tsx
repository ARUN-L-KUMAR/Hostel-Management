"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface Provision {
  id: string
  name: string
  unit: string
  unitCost: string
  unitMeasure: string
}

interface EditProvisionDialogProps {
  provision: Provision | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditProvisionDialog({ provision, open, onOpenChange, onSuccess }: EditProvisionDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    unitCost: "",
    unitMeasure: ""
  })
  const [loading, setLoading] = useState(false)

  // Update form data when provision changes
  useEffect(() => {
    if (provision) {
      setFormData({
        name: provision.name || "",
        unit: provision.unit || "",
        unitCost: provision.unitCost?.toString() || "",
        unitMeasure: provision.unitMeasure || ""
      })
    }
  }, [provision])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provision) return

    setLoading(true)
    try {
      await ApiClient.provisions.update(provision.id, {
        name: formData.name.trim(),
        unit: formData.unit.trim(),
        unitCost: parseFloat(formData.unitCost),
        unitMeasure: formData.unitMeasure.trim()
      })

      toast({
        title: "Success",
        description: "Provision item updated successfully",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating provision:", error)
      toast({
        title: "Error",
        description: "Failed to update provision item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit Provision Item</DialogTitle>
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
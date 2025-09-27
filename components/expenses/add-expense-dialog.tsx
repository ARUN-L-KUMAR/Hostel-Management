"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddExpenseDialog({ open, onOpenChange, onSuccess }: AddExpenseDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    amount: "",
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    description: "",
    billId: ""
  })
  const [loading, setLoading] = useState(false)

  const expenseTypes = [
    { value: "LABOUR", label: "Labour" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "UTILITY", label: "Utility" },
    { value: "OTHER", label: "Other" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Expense name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.type) {
      toast({
        title: "Error",
        description: "Expense type is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "Valid amount is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.date) {
      toast({
        title: "Error",
        description: "Date is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          amount: formData.amount,
          date: formData.date,
          description: formData.description.trim(),
          billId: formData.billId.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create expense')
      }

      toast({
        title: "Success",
        description: "Expense added successfully",
      })

      // Reset form
      setFormData({
        name: "",
        type: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        billId: ""
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to add expense",
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
      type: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      billId: ""
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter expense name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Expense Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter expense description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billId">Bill ID (Optional)</Label>
            <Input
              id="billId"
              value={formData.billId}
              onChange={(e) => handleInputChange("billId", e.target.value)}
              placeholder="Enter bill ID if applicable"
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
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
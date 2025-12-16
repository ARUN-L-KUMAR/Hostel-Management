"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Edit, Loader2, Key, CheckSquare, Square } from "lucide-react"

// Available pages for permissions
const AVAILABLE_PAGES = [
  { id: "dashboard", label: "Dashboard", description: "View main dashboard" },
  { id: "attendance", label: "Attendance", description: "Manage student attendance" },
  { id: "students", label: "Students", description: "Manage student records" },
  { id: "mando-students", label: "Mando Meal Entry", description: "Manage mando student meals" },
  { id: "outsiders", label: "Outsiders", description: "Manage outsider records" },
  { id: "provisions", label: "Provisions", description: "Manage provision inventory" },
  { id: "billing", label: "Billing", description: "Generate and manage bills" },
  { id: "expenses", label: "Expenses", description: "Manage expense records" },
  { id: "reports", label: "Reports", description: "View and generate reports" },
  { id: "admin", label: "Admin Panel", description: "Access admin settings" },
]

interface User {
  id: string
  name: string
  email: string
  role: string
  permissions?: string[]
}

interface EditUserDialogProps {
  user: User
  onUserUpdated: () => void
}

export function EditUserDialog({ user, onUserUpdated }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",  // Changed to string
    password: "",
    permissions: [] as string[]
  })

  // Handle permission toggle
  const handlePermissionToggle = (pageId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, pageId]
        : prev.permissions.filter(p => p !== pageId)
    }))
  }

  // Handle role change - update permissions accordingly
  const handleRoleChange = (role: string) => {
    let defaultPermissions: string[]

    if (role === "ADMIN") {
      defaultPermissions = AVAILABLE_PAGES.map(p => p.id) // All permissions for admin
    } else {
      // For managers, keep existing permissions or set empty if none exist
      defaultPermissions = formData.permissions.length > 0 ? formData.permissions : []
    }

    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions
    }))
  }

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && user) {
      console.log("Initializing edit form for user:", {
        name: user.name,
        role: user.role,
        permissions: user.permissions
      })

      // Load existing permissions or set defaults
      let userPermissions: string[] = []

      if (user.role === "ADMIN") {
        // Admin gets all permissions
        userPermissions = AVAILABLE_PAGES.map(p => p.id)
      } else {
        // Manager gets existing permissions or empty array if none
        userPermissions = Array.isArray(user.permissions) ? user.permissions : []
      }

      console.log("Setting permissions to:", userPermissions)

      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
        permissions: userPermissions
      })
      setChangePassword(false)
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill in all fields")
      return
    }

    if (changePassword && !formData.password) {
      toast.error("Please enter a new password")
      return
    }

    try {
      setLoading(true)

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions
      }

      // Include password only if changing password
      if (changePassword && formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast.success(changePassword ? "User updated and password changed successfully" : "User updated successfully")
      setOpen(false)
      onUserUpdated()
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast.error(error.message || "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">Edit User</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update user information and role permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-foreground">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="role" className="bg-background border-input">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="ADMIN">Admin (All Permissions)</SelectItem>
                <SelectItem value="MANAGER">Manager (Custom Permissions)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions Section for Managers */}
          {formData.role === "MANAGER" && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Page Permissions</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select which pages this manager can access
                </p>
              </div>

              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {AVAILABLE_PAGES.map((page) => (
                  <div key={page.id} className="flex items-start space-x-3 p-2 border border-border rounded-lg">
                    <button
                      type="button"
                      onClick={() => handlePermissionToggle(page.id, !formData.permissions.includes(page.id))}
                      className="mt-0.5"
                    >
                      {formData.permissions.includes(page.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{page.label}</div>
                      <div className="text-xs text-muted-foreground">{page.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                {formData.permissions.length} of {AVAILABLE_PAGES.length} permissions selected
              </div>
            </div>
          )}

          {/* Admin Permissions Info */}
          {formData.role === "ADMIN" && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="text-sm text-primary">
                  Admin users have access to all pages automatically
                </div>
              </div>
            </div>
          )}

          {/* Password Change Section */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="changePassword"
                checked={changePassword}
                onCheckedChange={(checked) => {
                  setChangePassword(!!checked)
                  if (!checked) {
                    setFormData(prev => ({ ...prev, password: "" }))
                  }
                }}
              />
              <Label htmlFor="changePassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <Key className="inline h-4 w-4 mr-1" />
                Change Password
              </Label>
            </div>

            {changePassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password"
                  className="bg-background border-input"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Password should be at least 6 characters long
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
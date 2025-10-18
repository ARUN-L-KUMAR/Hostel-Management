                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { toast } from "sonner"
import { UserPlus, Edit, Trash2, Shield, User, Settings, Loader2, CheckSquare, Square } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "MANAGER"
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
  password?: string | null
}

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

interface UserManagementProps {
  onUserChange?: () => void
}

export function UserManagement({ onUserChange }: UserManagementProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [deleteUserLoading, setDeleteUserLoading] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "" as "ADMIN" | "MANAGER" | "",
    password: "",
    permissions: [] as string[]
  })

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  // Handle permission toggle
  const handlePermissionToggle = (pageId: string, checked: boolean) => {
    setNewUser(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, pageId]
        : prev.permissions.filter(p => p !== pageId)
    }))
  }

  // Handle role change - set default permissions
  const handleRoleChange = (role: "ADMIN" | "MANAGER") => {
    const defaultPermissions = role === "ADMIN"
      ? AVAILABLE_PAGES.map(p => p.id) // All permissions for admin
      : [] // No default permissions for manager - admin must select manually

    setNewUser(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions
    }))

    console.log(`Role changed to ${role}, permissions set to:`, defaultPermissions)
  }

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      toast.error("Please fill in all fields including password")
      return
    }

    try {
      setAddUserLoading(true)
      // Map frontend roles to database roles
      const roleToSend = newUser.role === "MANAGER" ? "MANAGER" : newUser.role

      const userDataToSend = {
        name: newUser.name,
        email: newUser.email,
        role: roleToSend,
        password: newUser.password,
        permissions: newUser.permissions
      }

      console.log("Sending user data to API:", userDataToSend)

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDataToSend),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      const createdUser = await response.json()
      setUsers(prev => [...prev, createdUser])
      setNewUser({ name: "", email: "", role: "", password: "", permissions: [] })
      toast.success("User created successfully")
      onUserChange?.()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast.error(error.message || "Failed to create user")
    } finally {
      setAddUserLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      setDeleteUserLoading(userId)
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      setUsers(prev => prev.filter(user => user.id !== userId))
      toast.success("User deleted successfully")
      onUserChange?.()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    } finally {
      setDeleteUserLoading(null)
    }
  }

  // Format role display name
  const formatRole = (role: string) => {
    // No more mapping needed since the API now returns "MANAGER" directly
    return role.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "MANAGER":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />
      case "MANAGER":
        return <Settings className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])
  return (
    <div className="space-y-6">
      {/* Add User */}
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Create a new user account with appropriate permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin (All Permissions)</SelectItem>
                  <SelectItem value="MANAGER">Manager (Custom Permissions)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Permissions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Page Permissions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {newUser.role === "ADMIN"
                    ? "Admin users have access to all pages by default."
                    : "Select which pages this manager can access. No permissions are selected by default."
                  }
                </p>
              </div>

              {newUser.role === "MANAGER" && (
                <div className="grid gap-3 md:grid-cols-2">
                  {AVAILABLE_PAGES.map((page) => (
                    <div key={page.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle(page.id, !newUser.permissions.includes(page.id))}
                        className="mt-0.5"
                      >
                        {newUser.permissions.includes(page.id) ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{page.label}</div>
                        <div className="text-xs text-muted-foreground">{page.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {newUser.role === "ADMIN" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">Full Access</div>
                      <div className="text-sm text-blue-700">Admin users have access to all pages in the system.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddUser} disabled={addUserLoading}>
                {addUserLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Add User
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <div className="space-y-4 overflow-x-auto">
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found. Add the first user above.
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg min-w-[800px]">
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar>
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        {user.permissions && user.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {user.permissions.length} permissions
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="gap-1"
                        >
                          {getRoleIcon(user.role)}
                          {formatRole(user.role)}
                        </Badge>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() :
                           user.created_at ? new Date(user.created_at).toLocaleDateString() :
                           user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 
                           user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 
                           'Recent'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <EditUserDialog user={{
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          role: user.role,
                          permissions: user.permissions
                        }} onUserUpdated={fetchUsers} />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserLoading === user.id}
                        >
                          {deleteUserLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))

              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Configure permissions for different user roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 overflow-x-auto">
            <div className="grid gap-4 md:grid-cols-3 min-w-[500px]">
              <div className="font-medium">Permission</div>
              <div className="font-medium text-center">Admin</div>
              <div className="font-medium text-center">Manager</div>
            </div>

            {[
              { name: "View Dashboard", admin: true, manager: true },
              { name: "Manage Students", admin: true, manager: true },
              { name: "Edit Attendance", admin: true, manager: true },
              { name: "Generate Bills", admin: true, manager: true },
              { name: "View Reports", admin: true, manager: true },
              { name: "Manage Provisions", admin: true, manager: true },
              { name: "System Settings", admin: true, manager: false },
              { name: "User Management", admin: true, manager: false },
            ].map((permission) => (
              <div key={permission.name} className="grid gap-4 md:grid-cols-3 py-2 border-b min-w-[500px]">
                <div className="truncate">{permission.name}</div>
                <div className="text-center">
                  <Badge variant={permission.admin ? "default" : "secondary"}>{permission.admin ? "✓" : "✗"}</Badge>
                </div>
                <div className="text-center">
                  <Badge variant={permission.manager ? "default" : "secondary"}>{permission.manager ? "✓" : "✗"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
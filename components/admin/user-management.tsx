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
import { UserPlus, Edit, Trash2, Shield, User, Settings, Loader2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "MANAGER"
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
  password?: string | null
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [deleteUserLoading, setDeleteUserLoading] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "" as "ADMIN" | "MANAGER" | "",
    password: ""
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

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
      toast.error("Please fill in all fields including password")
      return
    }

    try {
      setAddUserLoading(true)
      // Map frontend roles to database roles
      // Since our type is "ADMIN" | "MANAGER" | "", we need to send the correct database values
      const roleToSend = newUser.role === "MANAGER" ? "MANAGER" : newUser.role
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({...newUser, role: roleToSend}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      const createdUser = await response.json()
      setUsers(prev => [...prev, createdUser])
      setNewUser({ name: "", email: "", role: "", password: "" })
      toast.success("User created successfully")
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
          <div className="grid gap-4 md:grid-cols-2 overflow-x-auto">
            <Input 
              placeholder="Full Name" 
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              className="truncate"
            />
            <Input 
              placeholder="Email Address" 
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              className="truncate"
            />
            <Input 
              placeholder="Password" 
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            />
            <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleAddUser} disabled={addUserLoading}>
              {addUserLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add User
            </Button>
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
                          role: user.role
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
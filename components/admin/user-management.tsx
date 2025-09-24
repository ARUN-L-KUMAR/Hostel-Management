import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Edit, Trash2, Shield, User, Settings } from "lucide-react"

const users = [
  { id: 1, name: "Admin User", email: "admin@mess.edu", role: "admin", status: "active", lastLogin: "2 hours ago" },
  { id: 2, name: "Mess Manager", email: "manager@mess.edu", role: "manager", status: "active", lastLogin: "1 day ago" },
  {
    id: 3,
    name: "Staff Member 1",
    email: "staff1@mess.edu",
    role: "staff",
    status: "active",
    lastLogin: "3 hours ago",
  },
  {
    id: 4,
    name: "Staff Member 2",
    email: "staff2@mess.edu",
    role: "staff",
    status: "inactive",
    lastLogin: "1 week ago",
  },
  {
    id: 5,
    name: "Accountant",
    email: "accounts@mess.edu",
    role: "accountant",
    status: "active",
    lastLogin: "5 hours ago",
  },
]

export function UserManagement() {
  return (
    <div className="space-y-6">
      {/* Add User */}
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Create a new user account with appropriate permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Input placeholder="Full Name" />
            <Input placeholder="Email Address" type="email" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
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
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Badge
                      variant={user.role === "admin" ? "default" : user.role === "manager" ? "secondary" : "outline"}
                      className="gap-1"
                    >
                      {user.role === "admin" && <Shield className="h-3 w-3" />}
                      {user.role === "manager" && <Settings className="h-3 w-3" />}
                      {(user.role === "staff" || user.role === "accountant") && <User className="h-3 w-3" />}
                      {user.role}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                  </div>
                  <div className="text-center min-w-[100px]">
                    <p className="text-sm text-muted-foreground">{user.lastLogin}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Configure permissions for different user roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="font-medium">Permission</div>
              <div className="font-medium text-center">Admin</div>
              <div className="font-medium text-center">Manager</div>
              <div className="font-medium text-center">Staff</div>
            </div>

            {[
              { name: "View Dashboard", admin: true, manager: true, staff: true },
              { name: "Manage Students", admin: true, manager: true, staff: false },
              { name: "Edit Attendance", admin: true, manager: true, staff: true },
              { name: "Generate Bills", admin: true, manager: true, staff: false },
              { name: "View Reports", admin: true, manager: true, staff: false },
              { name: "System Settings", admin: true, manager: false, staff: false },
              { name: "User Management", admin: true, manager: false, staff: false },
            ].map((permission) => (
              <div key={permission.name} className="grid gap-4 md:grid-cols-4 py-2 border-b">
                <div>{permission.name}</div>
                <div className="text-center">
                  <Badge variant={permission.admin ? "default" : "secondary"}>{permission.admin ? "✓" : "✗"}</Badge>
                </div>
                <div className="text-center">
                  <Badge variant={permission.manager ? "default" : "secondary"}>{permission.manager ? "✓" : "✗"}</Badge>
                </div>
                <div className="text-center">
                  <Badge variant={permission.staff ? "default" : "secondary"}>{permission.staff ? "✓" : "✗"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

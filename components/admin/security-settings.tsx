import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react"

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
          <CardDescription>Current security health and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">Secure</p>
              <p className="text-sm text-muted-foreground">Overall Status</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Lock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">256-bit</p>
              <p className="text-sm text-muted-foreground">Encryption</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Threats Detected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Settings</CardTitle>
          <CardDescription>Configure login security and password policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input id="session-timeout" type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-attempts">Max Login Attempts</Label>
              <Input id="max-attempts" type="number" defaultValue="5" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Strong Password Policy</Label>
                <p className="text-sm text-muted-foreground">Enforce complex passwords with special characters</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Account Lockout</Label>
                <p className="text-sm text-muted-foreground">Lock accounts after failed login attempts</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>Manage system access and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
              <Input id="allowed-ips" placeholder="192.168.1.0/24, 10.0.0.0/8" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-hours">Access Hours</Label>
              <Select defaultValue="24x7">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24x7">24/7 Access</SelectItem>
                  <SelectItem value="business">Business Hours Only</SelectItem>
                  <SelectItem value="custom">Custom Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IP Restriction</Label>
              <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Log all user actions and system events</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security-related activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { event: "Admin login", user: "admin@mess.edu", time: "2 hours ago", status: "success" },
              { event: "Password change", user: "manager@mess.edu", time: "1 day ago", status: "success" },
              { event: "Failed login attempt", user: "unknown@domain.com", time: "2 days ago", status: "blocked" },
              { event: "Data export", user: "admin@mess.edu", time: "3 days ago", status: "success" },
            ].map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                    {log.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {log.status === "blocked" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{log.event}</p>
                    <p className="text-sm text-muted-foreground">{log.user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">{log.time}</p>
                  <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View All Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Security Actions</CardTitle>
          <CardDescription>Emergency security controls and maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Force Password Reset</h4>
              <p className="text-sm text-muted-foreground">Require all users to reset passwords</p>
            </div>
            <Button variant="outline">Force Reset</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Revoke All Sessions</h4>
              <p className="text-sm text-muted-foreground">Log out all users immediately</p>
            </div>
            <Button variant="outline">Revoke Sessions</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
            <div>
              <h4 className="font-medium text-red-600">Emergency Lockdown</h4>
              <p className="text-sm text-muted-foreground">⚠️ Disable all system access</p>
            </div>
            <Button variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Lockdown
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

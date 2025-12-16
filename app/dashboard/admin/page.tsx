"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, Loader2, FileText } from "lucide-react"
import { UserManagement } from "@/components/admin/user-management"
import { AuditLogs } from "@/components/admin/audit-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserStats {
  total: number
  admins: number
  managers: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, admins: 0, managers: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch("/api/users")
      if (response.ok) {
        const users = await response.json()
        const stats = {
          total: users.length,
          admins: users.filter((u: any) => u.role === "ADMIN").length,
          managers: users.filter((u: any) => u.role === "MANAGER").length
        }
        setUserStats(stats)
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Check if user is admin and fetch stats
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user has admin role or admin permission
    const hasAdminAccess = session.user?.role === "ADMIN" ||
      (session.user?.role === "MANAGER" && session.user?.permissions?.includes("admin"))

    if (!hasAdminAccess) {
      router.push("/dashboard")
      return
    }

    // Fetch user statistics
    fetchUserStats()
  }, [session, status, router])

  const handleRefresh = () => {
    window.location.reload()
  }

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // If not admin or manager with admin permission, don't render the page
  if (!session) {
    return null
  }

  const hasAdminAccess = session.user?.role === "ADMIN" ||
    (session.user?.role === "MANAGER" && session.user?.permissions?.includes("admin"))

  if (!hasAdminAccess) {
    return null
  }

  return (
    <div className="space-y-8 overflow-x-hidden animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and configuration settings</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" onClick={handleRefresh} className="border-border shadow-sm">
            Refresh
          </Button>
          <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
            <Shield className="h-3 w-3" />
            {session.user?.role === "ADMIN" ? "Admin Access" : "Manager Access"}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 overflow-x-auto">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Users</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-md">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">{userStats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {userStats.admins} admin{userStats.admins !== 1 ? 's' : ''}, {userStats.managers} manager{userStats.managers !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Access Level</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-md">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {session.user?.role === "ADMIN" ? "Admin" : "Manager"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {session.user?.role === "ADMIN" ? "Full system access" : "Limited admin access"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="users"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-background/50 transition-all"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">User Management</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-background/50 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Logs</span>
            <span className="sm:hidden">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
          <UserManagement onUserChange={fetchUserStats} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
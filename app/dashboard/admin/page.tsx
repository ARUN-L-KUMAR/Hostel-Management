"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, Loader2 } from "lucide-react"
import { UserManagement } from "@/components/admin/user-management"

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

    // Check if user has admin role
    if (session.user?.role !== "ADMIN") {
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

  // If not admin, don't render the page
  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and configuration settings</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 overflow-x-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{userStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.admins} admin{userStats.admins !== 1 ? 's' : ''}, {userStats.managers} manager{userStats.managers !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Admin</div>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      <UserManagement onUserChange={fetchUserStats} />
    </div>
  )
}
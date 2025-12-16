"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"

export function DashboardHeader() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const handleSettingsClick = () => {
    router.push("/dashboard/admin")
  }

  const getRoleBadgeVariant = (role: string) => {
    // Map MESS_MANAGER to MANAGER for display
    const displayRole = role === "MESS_MANAGER" ? "MANAGER" : role
    switch (displayRole) {
      case "ADMIN":
        return "default"
      case "MANAGER":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatRole = (role: string) => {
    // Map MESS_MANAGER to MANAGER for display
    const displayRole = role === "MESS_MANAGER" ? "MANAGER" : role
    return displayRole.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (!session) return null

  return (
    <header className="bg-background border-b border-border sticky top-0 z-30 px-6 py-4 supports-[backdrop-filter]:bg-background/60 supports-[backdrop-filter]:backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Hostel Mess Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{session.user?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={getRoleBadgeVariant(session.user?.role || "")} className="gap-1 px-3 py-1">
            <User className="h-3 w-3" />
            {formatRole(session.user?.role || "")}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {session.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session.user?.role === "ADMIN" && (
                <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
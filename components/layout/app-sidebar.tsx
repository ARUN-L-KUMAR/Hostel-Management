"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Calendar,
  Users,
  Package,
  Receipt,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  TrendingUp,
  DollarSign,
  UtensilsCrossed,
  UserCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const pathname = usePathname()
  const { data: session } = useSession()

  // Filter menu items based on user permissions
  const getMenuItems = () => {
    const allItems = [
      { icon: Home, label: "Dashboard", href: "/dashboard", permission: "dashboard" },
      { icon: Users, label: "Students", href: "/dashboard/students", permission: "students" },
      { icon: Calendar, label: "Attendance", href: "/dashboard/attendance", permission: "attendance" },
      { icon: UtensilsCrossed, label: "Mando Meal Entry", href: "/dashboard/mando-students", permission: "mando-students" },
      { icon: UserCircle, label: "Outsiders", href: "/dashboard/outsiders", permission: "outsiders" },
      { icon: Package, label: "Provisions", href: "/dashboard/provisions", permission: "provisions" },
      { icon: Receipt, label: "Billing", href: "/dashboard/billing", permission: "billing" },
      { icon: DollarSign, label: "Expenses", href: "/dashboard/expenses", permission: "expenses" },
      { icon: FileText, label: "Reports", href: "/dashboard/reports", permission: "reports" },
      { icon: Settings, label: "Admin", href: "/dashboard/admin", permission: "admin" },
    ]

    const userPermissions = session?.user?.permissions as string[] || []

    if (session?.user?.role === "ADMIN") {
      return allItems
    }

    return allItems.filter(item => {
      if (item.permission === "dashboard") return true
      return userPermissions.includes(item.permission)
    })
  }

  const menuItems = getMenuItems()

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen z-40 bg-card",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50">
        {!isCollapsed && (
          <div className="flex items-center space-x-2 min-w-0 transition-opacity duration-300 animate-in fade-in slide-in-from-left-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-foreground tracking-tight truncate">
              Mess Manager
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8 shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isCollapsed && "ml-auto mr-auto")}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isCollapsed && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Operational</span>
          </div>
        </div>
      )}
    </div>
  )
}


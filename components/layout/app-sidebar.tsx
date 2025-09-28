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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Filter menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: "Dashboard", href: "/dashboard" },
      { icon: Calendar, label: "Attendance", href: "/dashboard/attendance" },
      { icon: Users, label: "Students", href: "/dashboard/students" },
      { icon: Calendar, label: "Mando Meal Entry", href: "/dashboard/mando-students" },
      { icon: Users, label: "Outsiders", href: "/dashboard/outsiders" },
      { icon: Package, label: "Provisions", href: "/dashboard/provisions" },
      { icon: TrendingUp, label: "Provision Tracker", href: "/dashboard/provision-tracker" },
      { icon: Receipt, label: "Billing", href: "/dashboard/billing" },
      { icon: DollarSign, label: "Expenses", href: "/dashboard/expenses" },
      { icon: FileText, label: "Reports", href: "/dashboard/reports" },
    ]

    // Only show admin link to ADMIN users
    if (session?.user?.role === "ADMIN") {
      return [...baseItems, { icon: Settings, label: "Admin", href: "/dashboard/admin" }]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  return (
    <div
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen z-40",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 truncate">Mess Manager</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 h-auto flex-shrink-0">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <>
          <Separator />
          <div className="p-4">
            <div className="text-xs text-slate-500 text-center truncate">Hostel Mess Management v1.0</div>
          </div>
        </>
      )}
    </div>
  )
}

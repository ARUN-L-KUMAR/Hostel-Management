"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopNavbar } from "@/components/layout/top-navbar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar()

  return (
    <div
      className={cn(
        "flex flex-col min-w-0 transition-all duration-300",
        state === "expanded" ? "ml-64" : "ml-16"
      )}
    >
      <DashboardHeader />
      <TopNavbar />
      <main className="flex-1 p-6 bg-slate-50 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden">
        <AppSidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  )
}

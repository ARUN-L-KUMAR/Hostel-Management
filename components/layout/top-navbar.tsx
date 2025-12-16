"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const months = [
  { value: "2024-12", label: "December 2024" },
  { value: "2024-11", label: "November 2024" },
  { value: "2024-10", label: "October 2024" },
  { value: "2024-09", label: "September 2024" },
  { value: "2024-08", label: "August 2024" },
  { value: "2024-07", label: "July 2024" },
]

export function TopNavbar() {
  const [selectedMonth, setSelectedMonth] = useState("2024-12")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="bg-background/95 border-b border-border px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">


        {/* Right side - Empty for now since user profile is in header */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* User profile functionality is handled in DashboardHeader */}
        </div>
      </div>
    </header>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StudentsTable } from "@/components/students/students-table"
import { StudentsFilters } from "@/components/students/students-filters"
import { StudentsActions } from "@/components/students/students-actions"

export default function StudentsPage() {
  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    status: "all",
    mandoFilter: "regular",
    dept: "all",
    search: "",
  })

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-600">Manage student profiles, Mando status, and billing information</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <StudentsActions />
        </div>
      </div>

      {/* Filters */}
      <StudentsFilters onFiltersChange={setFilters} />

      {/* Students Table */}
      <StudentsTable filters={filters} />
    </div>
  )
}
import { Suspense } from "react"
import { StudentsTable } from "@/components/students/students-table"
import { StudentsFilters } from "@/components/students/students-filters"
import { StudentsActions } from "@/components/students/students-actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-600">Manage student profiles, Mando status, and billing information</p>
        </div>
        <StudentsActions />
      </div>

      {/* Filters */}
      <StudentsFilters />

      {/* Students Table */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
      >
        <StudentsTable />
      </Suspense>
    </div>
  )
}

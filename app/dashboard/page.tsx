import { Suspense } from "react"
import { DashboardKPIs } from "@/components/dashboard/dashboard-kpis"
import { ExpenseChart } from "@/components/dashboard/expense-chart"
import { MandaysChart } from "@/components/dashboard/mandays-chart"
import { AlertsBanner } from "@/components/dashboard/alerts-banner"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Alerts Banner */}
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <AlertsBanner />
      </Suspense>

      {/* KPIs */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
      >
        <DashboardKPIs />
      </Suspense>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <ExpenseChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80" />}>
          <MandaysChart />
        </Suspense>
      </div>
    </div>
  )
}

import { Suspense } from "react"
import { BillingWizard } from "@/components/billing/billing-wizard"
import { Skeleton } from "@/components/ui/skeleton"

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing Management</h1>
        <p className="text-slate-600">Generate and manage monthly bills with Mando coverage</p>
      </div>

      {/* Billing Wizard */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BillingWizard />
      </Suspense>
    </div>
  )
}

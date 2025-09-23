"use client"

import { ProvisionsTable } from "@/components/provisions/provisions-table"
import { ProvisionsActions } from "@/components/provisions/provisions-actions"
import { ProvisionsChart } from "@/components/provisions/provisions-chart"

export default function ProvisionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provision Management</h1>
          <p className="text-slate-600">Track inventory, costs, and usage of mess provisions</p>
        </div>
        <ProvisionsActions />
      </div>

      {/* Provisions Chart */}
      <ProvisionsChart />

      {/* Provisions Table */}
      <ProvisionsTable />
    </div>
  )
}

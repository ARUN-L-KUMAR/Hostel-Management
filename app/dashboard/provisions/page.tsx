"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProvisionsTable } from "@/components/provisions/provisions-table"
import { ProvisionsActions } from "@/components/provisions/provisions-actions"

export default function ProvisionsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleTableRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provision Management</h1>
          <p className="text-slate-600">Track inventory, costs, and usage of mess provisions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <ProvisionsActions onRefresh={handleTableRefresh} />
        </div>
      </div>

      {/* Provisions Table */}
      <ProvisionsTable key={refreshTrigger} />
    </div>
  )
}

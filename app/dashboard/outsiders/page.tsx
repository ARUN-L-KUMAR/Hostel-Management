"use client"

import { useState } from "react"
import { OutsidersTable } from "@/components/outsiders/outsiders-table"
import { OutsidersActions } from "@/components/outsiders/outsiders-actions"

export default function OutsidersPage() {
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outsiders</h1>
          <p className="text-slate-600">Manage outsiders and their meal records</p>
        </div>
        <OutsidersActions />
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search outsiders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Outsiders Table */}
      <OutsidersTable search={search} />
    </div>
  )
}
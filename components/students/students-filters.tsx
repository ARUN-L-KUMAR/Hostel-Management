"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, RotateCcw, Search } from "lucide-react"

export function StudentsFilters() {
  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    status: "all",
    mandoOnly: false,
    search: "",
  })

  const handleReset = () => {
    setFilters({
      hostel: "all",
      year: "all",
      status: "all",
      mandoOnly: false,
      search: "",
    })
  }

  return (
    <Card className="p-4 border-0 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-900">Filters</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Name or roll number..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        {/* Hostel Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Hostel</Label>
          <Select value={filters.hostel} onValueChange={(value) => setFilters((prev) => ({ ...prev, hostel: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select hostel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              <SelectItem value="boys">Boys Hostel</SelectItem>
              <SelectItem value="girls">Girls Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Year</Label>
          <Select value={filters.year} onValueChange={(value) => setFilters((prev) => ({ ...prev, year: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Status</Label>
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="GRADUATED">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mando Only Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Mando Filter</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="mando-only"
              checked={filters.mandoOnly}
              onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, mandoOnly: checked }))}
            />
            <Label htmlFor="mando-only" className="text-sm text-slate-600">
              Mando only
            </Label>
          </div>
        </div>
      </div>
    </Card>
  )
}

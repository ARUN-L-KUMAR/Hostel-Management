"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, RotateCcw, Search } from "lucide-react"

interface StudentsFiltersProps {
  onFiltersChange: (filters: {
    hostel: string
    year: string
    status: string
    mandoFilter: string
    dept: string
    search: string
  }) => void
}

export function StudentsFilters({ onFiltersChange }: StudentsFiltersProps) {
  const [filters, setFilters] = useState({
    hostel: "all",
    year: "all",
    status: "all",
    mandoFilter: "all",
    dept: "all",
    search: "",
  })

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      hostel: "all",
      year: "all",
      status: "all",
      mandoFilter: "all",
      dept: "all",
      search: "",
    }
    setFilters(resetFilters)
    onFiltersChange(resetFilters)
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

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Name or roll number..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Hostel Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Hostel</Label>
          <Select value={filters.hostel} onValueChange={(value) => handleFilterChange({ hostel: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select hostel" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Hostels</SelectItem>
              <SelectItem value="Boys">Boys Hostel</SelectItem>
              <SelectItem value="Girls">Girls Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Year</Label>
          <Select value={filters.year} onValueChange={(value) => handleFilterChange({ year: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange({ status: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="VACATED">Vacated</SelectItem>  
            </SelectContent>
          </Select>
        </div>

        {/* Dept Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Dept</Label>
          <Select value={filters.dept} onValueChange={(value) => handleFilterChange({ dept: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select dept" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="cse">CSE</SelectItem>
              <SelectItem value="ece">ECE</SelectItem>
              <SelectItem value="eee">EEE</SelectItem>
              <SelectItem value="mech">Mech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        
      </div>
    </Card>
  )
}
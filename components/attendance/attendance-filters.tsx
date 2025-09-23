"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Filter, RotateCcw } from "lucide-react"

export function AttendanceFilters() {
  const [hostelFilter, setHostelFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [mandoOnly, setMandoOnly] = useState(false)

  const handleReset = () => {
    setHostelFilter("all")
    setYearFilter("all")
    setMandoOnly(false)
  }

  return (
    <Card className="p-4 border-0 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-900">Filters</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Hostel Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Hostel</Label>
          <Select value={hostelFilter} onValueChange={setHostelFilter}>
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
          <Select value={yearFilter} onValueChange={setYearFilter}>
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

        {/* Mando Only Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Mando Students</Label>
          <div className="flex items-center space-x-2">
            <Switch id="mando-only" checked={mandoOnly} onCheckedChange={setMandoOnly} />
            <Label htmlFor="mando-only" className="text-sm text-slate-600">
              Show only Mando students
            </Label>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Quick Stats</Label>
          <div className="text-sm text-slate-600">
            <div>Total Students: 50</div>
            <div>Mando Students: 12</div>
            <div>Present Today: 47</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

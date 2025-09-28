"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface YearPickerProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function YearPicker({ value, onValueChange, className, placeholder = "Select year" }: YearPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const currentYear = new Date().getFullYear()

  // Generate years from 1990 to 3000
  const allYears = Array.from({ length: 3000 - 1990 + 1 }, (_, i) => (1990 + i).toString())

  // Filter years based on search term
  const filteredYears = searchTerm
    ? allYears.filter(year => year.includes(searchTerm))
    : allYears.slice(0, 50) // Show first 50 years by default

  return (
    <div className="space-y-2">
      
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Search input */}
          <div className="p-2">
            <Input
              placeholder="Search year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Year options */}
          {filteredYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}

          {/* Show current year prominently if not in filtered results */}
          {searchTerm && !filteredYears.includes(currentYear.toString()) && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t">
                Current Year
              </div>
              <SelectItem value={currentYear.toString()}>
                {currentYear} (Current)
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MealEntryGrid } from "@/components/meal-entry/meal-entry-grid"
import { MealEntryLegend } from "@/components/meal-entry/meal-entry-legend"
import { MealEntryPeriodFilters } from "@/components/meal-entry/meal-entry-period-filters"
import { ApiClient } from "@/lib/api-client"

interface Student {
  id: string
  name: string
  rollNo: string
  dept: string | null
  gender: string | null
  company: string | null
  year?: number
  hostel?: { name: string }
  meals: Array<{
    id: number
    date: string
    breakfast: boolean
    lunch: boolean
    dinner: boolean
    present: boolean
    mealRate: number
  }>
}

export function MealEntryCalendar({ year, month, onExport, onStudentsChange }: { year: string; month: string; onExport?: (students: any[]) => void; onStudentsChange?: (students: any[]) => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  // Read filter params from URL
  const searchFilter = searchParams.get("search") || ""
  const hostelFilter = searchParams.get("hostel") || "all"
  const yearFilter = searchParams.get("yearFilter") || "all"
  const deptFilter = searchParams.get("dept") || "all"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all mando students (students where isMando = true)
        const studentsData = await ApiClient.students.getAll({ isMando: "true" })

        // Filter out students with invalid IDs
        interface StudentData {
          id: string;
          name: string;
          rollNo: string;
          company: string | null;
          year?: number;
          dept?: string | null;
          hostel?: { name: string };
        }
        const validStudentsData = studentsData.filter((s: StudentData) => s.id && s.id !== 'NaN' && s.id.trim() !== '')

        // Apply client-side filters
        const filteredStudents = validStudentsData.filter((student: StudentData) => {
          const matchesSearch = !searchFilter ||
            student.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
            student.rollNo?.toLowerCase().includes(searchFilter.toLowerCase())
          const matchesHostel = hostelFilter === "all" || student.hostel?.name === hostelFilter
          const matchesYear = yearFilter === "all" || student.year?.toString() === yearFilter
          const matchesDept = deptFilter === "all" || (student.dept && student.dept.toLowerCase().includes(deptFilter.toLowerCase()))

          return matchesSearch && matchesHostel && matchesYear && matchesDept
        })

        console.log(`[v0] Fetched ${studentsData.length} mando students, ${validStudentsData.length} valid, ${filteredStudents.length} after filters`)

        // For each student, fetch their meal records for the current month
        const studentsWithMeals = await Promise.all(
          filteredStudents.map(async (student: any) => {
            try {
              const mealRecords = await fetch(`/api/mando-meal-records?studentId=${student.id}&month=${month}&year=${year}`)
                .then(res => res.json())
                .catch(() => [])

              return {
                ...student,
                meals: mealRecords || [],
              }
            } catch (error) {
              console.error(`Error fetching meals for student ${student.id}:`, error)
              return {
                ...student,
                meals: [],
              }
            }
          })
        )

        console.log(`Final result: ${studentsWithMeals.length} mando students with meal data`)
        setStudents(studentsWithMeals)
        if (onStudentsChange) {
          onStudentsChange(studentsWithMeals)
        }
      } catch (error) {
        console.error("Error fetching meal data:", error)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year, month, searchFilter, hostelFilter, yearFilter, deptFilter])

  // Generate days for the month
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const currentMonth = `${year}-${month.padStart(2, '0')}`

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <MealEntryPeriodFilters />
        <MealEntryLegend />
        <div className="flex items-center justify-center h-64 border rounded-lg bg-card text-card-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading meal data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <MealEntryPeriodFilters />
      <MealEntryLegend />
      <MealEntryGrid students={students} days={days} currentMonth={currentMonth} total={students.length} onExport={onExport} />
    </div>
  )
}
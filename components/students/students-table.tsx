"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, MoreHorizontal, UserX, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ApiClient } from "@/lib/api-client"
import { RemoveStudentDialog } from "./remove-student-dialog"
import { BulkRemoveDialog } from "./bulk-remove-dialog"

interface Student {
  id: string
  name: string
  rollNo: string
  dept: string | null
  year: number
  isMando: boolean
  status: string
  hostel: { name: string }
  stats: {
    totalDays: number
    presentDays: number
    leaveDays: number
    concessionDays: number
    mandays: number
  }
}

interface StudentsTableProps {
  filters: {
    hostel: string
    year: string
    status: string
    mandoFilter: string
    dept: string
    search: string
  }
}

export function StudentsTable({ filters }: StudentsTableProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [bulkRemoveDialogOpen, setBulkRemoveDialogOpen] = useState(false)

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        // Apply server-side filtering based on mandoFilter
        const apiFilters: any = {}

        if (filters.hostel !== "all") {
          apiFilters.hostel = filters.hostel
        }

        if (filters.year !== "all") {
          apiFilters.year = filters.year
        }

        if (filters.status !== "all") {
          apiFilters.status = filters.status
        }

        if (filters.mandoFilter && filters.mandoFilter !== "all") {
          apiFilters.isMando = filters.mandoFilter === "mando" ? "true" : "false"
        }


        if (filters.dept !== "all") {
          apiFilters.dept = filters.dept
        }

        if (filters.search) {
          apiFilters.search = filters.search
        }

        console.log('Frontend: Sending API filters:', apiFilters)

        const response = await ApiClient.students.getAll(apiFilters)

        console.log('Frontend: API filters sent:', apiFilters)
        console.log('Frontend: API response length:', response.length)

        // Calculate stats for each student (simplified)
        const studentsWithStats = response.map((student: any) => ({
          ...student,
          stats: {
            totalDays: 0, // Would need attendance data
            presentDays: 0,
            leaveDays: 0,
            concessionDays: 0,
            mandays: 0,
          },
        }))

        setStudents(studentsWithStats)
      } catch (error) {
        console.error("Error fetching students:", error)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [filters]) // Fetch when filters change

  const handleRemoveStudent = (student: Student) => {
    setSelectedStudent(student)
    setRemoveDialogOpen(true)
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleBulkRemove = () => {
    if (selectedStudents.size > 0) {
      setBulkRemoveDialogOpen(true)
    }
  }

  const isAllSelected = students.length > 0 && selectedStudents.size === students.length
  const isIndeterminate = selectedStudents.size > 0 && selectedStudents.size < students.length

  const handleStudentRemoved = () => {
    // Clear selections and refresh the students list
    setSelectedStudents(new Set())

    const fetchStudents = async () => {
      setLoading(true)
      try {
        const apiFilters: any = {}

        if (filters.hostel !== "all") {
          apiFilters.hostel = filters.hostel
        }
        if (filters.year !== "all") {
          apiFilters.year = filters.year
        }
        if (filters.status !== "all") {
          apiFilters.status = filters.status
        }
        if (filters.mandoFilter && filters.mandoFilter !== "all") {
          apiFilters.isMando = filters.mandoFilter === "mando" ? "true" : "false"
        }
        if (filters.dept !== "all") {
          apiFilters.dept = filters.dept
        }
        if (filters.search) {
          apiFilters.search = filters.search
        }

        console.log('Frontend: Refreshing with API filters:', apiFilters)

        const response = await ApiClient.students.getAll(apiFilters)
        const studentsWithStats = response.map((student: any) => ({
          ...student,
          stats: {
            totalDays: 0,
            presentDays: 0,
            leaveDays: 0,
            concessionDays: 0,
            mandays: 0,
          },
        }))

        setStudents(studentsWithStats)
      } catch (error) {
        console.error("Error fetching students:", error)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }

  // Students are now filtered server-side

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Loading Students...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/40 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Students ({students.length})</CardTitle>
          {selectedStudents.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkRemove}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove Selected ({selectedStudents.size})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all students"
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Dept</TableHead>
              <TableHead>Hostel</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No students found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                      aria-label={`Select ${student.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.rollNo}</div>
                    </div>
                  </TableCell>
                  <TableCell>{student.dept || 'Not Set'}</TableCell>
                  <TableCell>{student.hostel?.name || 'Unknown'}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>
                    {student.isMando ? (
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-0">
                        Mando
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Regular</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === "ACTIVE" ? "default" : "secondary"}
                      className={
                        student.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/students/${student.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveStudent(student)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remove Student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Remove Student Dialog */}
      <RemoveStudentDialog
        student={selectedStudent}
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onStudentRemoved={handleStudentRemoved}
      />

      {/* Bulk Remove Dialog */}
      <BulkRemoveDialog
        students={students.filter(s => selectedStudents.has(s.id))}
        open={bulkRemoveDialogOpen}
        onOpenChange={setBulkRemoveDialogOpen}
        onStudentsRemoved={handleStudentRemoved}
      />
    </Card>
  )
}

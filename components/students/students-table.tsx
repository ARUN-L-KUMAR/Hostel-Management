"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ApiClient } from "@/lib/api-client"

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

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        // Fetch all students without filters
        const response = await ApiClient.students.getAll({})

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
  }, []) // Only fetch once

  // Client-side filtering
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      filters.search === "" ||
      student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(filters.search.toLowerCase())

    const matchesHostel = filters.hostel === "all" || student.hostel?.name === filters.hostel

    const matchesYear = filters.year === "all" || student.year?.toString() === filters.year

    const matchesStatus = filters.status === "all" || student.status === filters.status

    const matchesDept = filters.dept === "all" || (student.dept && student.dept.toLowerCase().includes(filters.dept.toLowerCase()))

    const matchesMando = filters.mandoFilter === "all" ||
      (filters.mandoFilter === "mando" && student.isMando) ||
      (filters.mandoFilter === "regular" && !student.isMando)

    return matchesSearch && matchesHostel && matchesYear && matchesStatus && matchesDept && matchesMando
  })

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Loading Students...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Students ({filteredStudents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No students found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{student.name}</div>
                      <div className="text-sm text-slate-500">{student.rollNo}</div>
                    </div>
                  </TableCell>
                  <TableCell>{student.dept || 'Not Set'}</TableCell>
                  <TableCell>{student.hostel?.name || 'Unknown'}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>
                    {student.isMando ? (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Mando
                      </Badge>
                    ) : (
                      <Badge variant="outline">Regular</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === "ACTIVE" ? "default" : "secondary"}
                      className={
                        student.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

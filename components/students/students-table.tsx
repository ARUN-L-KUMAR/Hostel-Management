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
    mandoOnly: boolean
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
        const params: any = {}

        if (filters.hostel !== "all") params.hostel = filters.hostel
        if (filters.year !== "all") params.year = filters.year
        if (filters.status !== "all") params.status = filters.status
        if (filters.mandoOnly) params.isMando = "true"
        if (filters.search) params.search = filters.search

        const response = await ApiClient.students.getAll(params)

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
  }, [filters])

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Students ({students.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Hostel</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Days</TableHead>
              <TableHead className="text-right">Mandays</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-slate-900">{student.name}</div>
                    <div className="text-sm text-slate-500">{student.rollNo}</div>
                  </div>
                </TableCell>
                <TableCell>{student.hostel.name}</TableCell>
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
                <TableCell className="text-right">{student.stats.totalDays}</TableCell>
                <TableCell className="text-right font-medium">{student.stats.mandays}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

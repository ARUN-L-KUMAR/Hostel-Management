"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ApiClient } from "@/lib/api-client"

interface MandoStudent {
  id: number
  name: string
  companyId: string | null
  createdAt: string
  meals: any[]
}

interface MandoStudentsTableProps {
  search: string
}

export function MandoStudentsTable({ search }: MandoStudentsTableProps) {
  const [mandoStudents, setMandoStudents] = useState<MandoStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMandoStudents = async () => {
      setLoading(true)
      try {
        const response = await ApiClient.mandoStudents.getAll({ search })
        setMandoStudents(response)
      } catch (error) {
        console.error("Error fetching mando students:", error)
        setMandoStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchMandoStudents()
  }, [search])

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Loading Mando Students...</CardTitle>
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
        <CardTitle>Mando Students ({mandoStudents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company ID</TableHead>
              <TableHead>Meals Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mandoStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  No mando students found.
                </TableCell>
              </TableRow>
            ) : (
              mandoStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.companyId || 'Not Set'}</TableCell>
                  <TableCell>{student.meals.length}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
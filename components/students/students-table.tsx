import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

async function getStudentsData() {
  const students = await prisma.student.findMany({
    include: {
      hostel: true,
      attendance: {
        where: {
          date: {
            gte: new Date("2024-12-01"),
            lte: new Date("2024-12-31"),
          },
        },
      },
    },
    orderBy: [{ hostel: { name: "asc" } }, { name: "asc" }],
  })

  // Calculate monthly stats for each student
  const studentsWithStats = students.map((student) => {
    // Safe access to attendance data with fallback to empty array
    const attendance = student.attendance || []
    const totalDays = attendance.length
    const presentDays = attendance.filter((att: any) => att.code === "P").length
    const leaveDays = attendance.filter((att: any) => att.code === "L").length
    const concessionDays = attendance.filter((att: any) => att.code === "CN").length

    return {
      ...student,
      stats: {
        totalDays,
        presentDays,
        leaveDays,
        concessionDays,
        mandays: presentDays + (leaveDays || 0), // Assuming leave is charged
      },
    }
  })

  return studentsWithStats
}

export async function StudentsTable() {
  const students = await getStudentsData()

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

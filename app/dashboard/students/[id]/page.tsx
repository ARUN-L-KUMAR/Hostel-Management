import { notFound } from "next/navigation"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { StudentProfile } from "@/components/students/student-profile"
import { StudentAttendanceHistory } from "@/components/students/student-attendance-history"
import { StudentBillingHistory } from "@/components/students/student-billing-history"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getStudent(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      hostel: true,
      attendance: {
        orderBy: { date: "desc" },
        take: 100,
      },
      studentBills: {
        include: { bill: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!student) {
    notFound()
  }

  return student
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await getStudent(params.id)

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <StudentProfile student={student} />
      </Suspense>

      {/* Tabs for different views */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Attendance History</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <StudentAttendanceHistory studentId={student.id} attendance={student.attendance} />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <StudentBillingHistory studentId={student.id} bills={student.studentBills} />
          </Suspense>
        </TabsContent>

        <TabsContent value="profile">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <StudentProfile student={student} editable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

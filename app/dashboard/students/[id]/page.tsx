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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Student Profile Header */}
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <StudentProfile student={student} />
      </Suspense>

      {/* Tabs for different views */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border border-border/50 h-auto">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            Attendance History
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            Billing History
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            Profile Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="outline-none focus-visible:ring-0">
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <StudentAttendanceHistory studentId={student.id} attendance={student.attendance} />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing" className="outline-none focus-visible:ring-0">
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <StudentBillingHistory studentId={student.id} bills={student.studentBills} />
          </Suspense>
        </TabsContent>

        <TabsContent value="profile" className="outline-none focus-visible:ring-0">
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <StudentProfile student={student} editable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

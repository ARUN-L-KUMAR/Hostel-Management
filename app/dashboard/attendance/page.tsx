import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { Card, CardContent } from "@/components/ui/card"

export default function AttendancePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear().toString()
    const currentMonth = (currentDate.getMonth() + 1).toString()

    const year = typeof searchParams.year === "string" ? searchParams.year : currentYear
    const month = typeof searchParams.month === "string" ? searchParams.month : currentMonth

    // Default filters
    const filters = {
        hostel: typeof searchParams.hostel === "string" ? searchParams.hostel : "all",
        year: typeof searchParams.yearFilter === "string" ? searchParams.yearFilter : "all",
        mandoFilter: typeof searchParams.mando === "string" ? searchParams.mando : "all",
        status: typeof searchParams.status === "string" ? searchParams.status : "ACTIVE",
        dept: typeof searchParams.dept === "string" ? searchParams.dept : "all",
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Attendance Management</h2>
                    <p className="text-muted-foreground">Manage and track student daily attendance records.</p>
                </div>
            </div>

            <Card className="shadow-sm border-border/60">
                <CardContent className="p-0">
                    <AttendanceCalendar
                        year={year}
                        month={month}
                        filters={filters}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

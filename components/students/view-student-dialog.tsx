"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StudentProfile } from "./student-profile"
import { Loader2 } from "lucide-react"

interface ViewStudentDialogProps {
    studentId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEditClick?: (student: any) => void
}

export function ViewStudentDialog({ studentId, open, onOpenChange, onEditClick }: ViewStudentDialogProps) {
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && studentId) {
            const fetchStudent = async () => {
                setLoading(true)
                try {
                    // We can fetch the student details from the list API with filtering or a specific ID endpoint if available.
                    // Since the list endpoint returns most data, we might just be able to use the data passed from the table,
                    // but for a "full profile" usually we want fresh data. 
                    // However, our API structure is list-based largely. 
                    // Let's try to fetch by ID if we have an endpoint, or just filter from the list if not.
                    // Wait, the page implementation uses `prisma.student.findUnique`. 
                    // But here we are client side. We don't have a specific `GET /api/students/:id` route exposed clearly in standard Next.js app router conventions unless we made one.
                    // The current `GET /api/students` supports filtering. Let's see if we can filter by ID or just use it.
                    // Actually, looking at `app/api/students/route.ts`, it doesn't seem to support `id` filter explicitly, but we can verify.
                    // `app/dashboard/students/[id]/page.tsx` uses server component to fetch. 
                    // We might need to add `id` support to the GET API or just pass the full student object from the table if it has enough info.
                    // The table currently has: id, name, rollNo, dept, year, isMando, status, hostel, stats.
                    // The profile needs: joinDate, leaveDate, company, etc. 
                    // Let's update the GET API to support ID filtering or just rely on the table data for now if we want to avoid API changes, 
                    // BUT updating the API is cleaner. 
                    // Looking at `GET` in `app/api/students/route.ts`, it accepts search params. We can add `id`.

                    // Let's assume we will update the API to support fetching by ID to get full details like joinDate/leaveDate/company which might not be in the table view.
                    // Or, simple hack: The table data might be missing some fields. 
                    // Let's first try to just use what we have, or better, fetch fresh.

                    // Let's try fetching with a query param if we add it, e.g. `?id=...`
                    // I will check the API again. It doesn't look like it has `id` filter.

                    // For now, I will implement this to fetch using a new query param `id` which I will add to the API. 
                    // This ensures we get the latest data including fields not in the table row.

                    const response = await fetch(`/api/students?id=${studentId}`)
                    if (response.ok) {
                        const data = await response.json()
                        // The API currently returns an array even if filtered. 
                        // Providing we modify the API to support ID, it might return an array or object.
                        // If we add `id` filter to `GET`, it usually returns an array of matches.
                        if (Array.isArray(data) && data.length > 0) {
                            setStudent(data[0])
                        } else if (!Array.isArray(data)) {
                            setStudent(data)
                        }
                    }
                } catch (error) {
                    console.error("Error fetching student details:", error)
                } finally {
                    setLoading(false)
                }
            }

            fetchStudent()
        }
    }, [open, studentId])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Student Details</DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : student ? (
                        <StudentProfile
                            student={student}
                            editable={false}
                        // We can pass a prop to show an "Edit" button that calls our onEditClick
                        // But StudentProfile internal edit mode is local. 
                        // We can wrapper it.
                        />
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            Failed to load student details.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

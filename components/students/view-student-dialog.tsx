"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Building, Calendar, Briefcase } from "lucide-react"

interface Student {
    id: string
    name: string
    rollNo: string
    dept?: string | null
    year: number
    isMando: boolean
    company?: string | null
    status: string
    joinDate?: Date | string
    leaveDate?: Date | null
    hostel: {
        name: string
    }
}

interface ViewStudentDialogProps {
    student: Student | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewStudentDialog({ student, open, onOpenChange }: ViewStudentDialogProps) {
    if (!student) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        Student Profile
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Full Name</p>
                                <p className="text-lg font-semibold text-foreground">{student.name}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Roll Number</p>
                                <p className="font-medium text-foreground">{student.rollNo}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="font-medium text-foreground">{student.dept || "Not Set"}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Academic Year</p>
                                <p className="font-medium text-foreground">Year {student.year}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Hostel</p>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md w-fit">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{student.hostel?.name || 'Unknown'} Hostel</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge
                                    variant={student.status === "ACTIVE" ? "default" : "secondary"}
                                    className={student.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0" : ""}
                                >
                                    {student.status}
                                </Badge>
                            </div>

                            {student.status === "VACATE" && student.leaveDate && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Leave Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium text-foreground">
                                            {new Date(student.leaveDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Mando Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            Mando Status
                            {student.isMando && (
                                <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-0">
                                    Active
                                </Badge>
                            )}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Mando Student</p>
                                <p className="font-medium text-foreground">
                                    {student.isMando ? "Enrolled in Mando program" : "Not enrolled"}
                                </p>
                            </div>

                            {student.isMando && student.company && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Company</p>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium text-foreground">{student.company}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {student.isMando && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-400">
                                    <strong>Mando Billing:</strong> This student's mess bills are covered by the Mando budget. They will not be charged individually for meals.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

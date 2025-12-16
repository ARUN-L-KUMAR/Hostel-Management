"use client"

import { useState } from "react"
import { Users, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudentsTable } from "@/components/students/students-table"
import { StudentsActions } from "@/components/students/students-actions"

export default function StudentsPage() {
    const [filters, setFilters] = useState({
        hostel: "all",
        year: "all",
        status: "ACTIVE", // Default to active students
        mandoFilter: "all",
        dept: "all",
        search: ""
    })

    // Debounce search update
    const handleSearchChange = (value: string) => {
        setFilters(prev => ({ ...prev, search: value }))
    }

    const resetFilters = () => {
        setFilters({
            hostel: "all",
            year: "all",
            status: "ACTIVE",
            mandoFilter: "all",
            dept: "all",
            search: ""
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Students</h1>
                    <p className="text-muted-foreground mt-1">Manage student records, admissions, and details.</p>
                </div>
                <StudentsActions />
            </div>



            {/* Filters & Table */}
            <div className="grid gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Search</label>
                                <Input
                                    placeholder="Name or Roll No..."
                                    value={filters.search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Hostel</label>
                                <Select value={filters.hostel} onValueChange={(v) => setFilters(prev => ({ ...prev, hostel: v }))}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Hostel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Hostels</SelectItem>
                                        <SelectItem value="Boys">Boys Hostel</SelectItem>
                                        <SelectItem value="Girls">Girls Hostel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Year</label>
                                <Select value={filters.year} onValueChange={(v) => setFilters(prev => ({ ...prev, year: v }))}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        <SelectItem value="1">1st Year</SelectItem>
                                        <SelectItem value="2">2nd Year</SelectItem>
                                        <SelectItem value="3">3rd Year</SelectItem>
                                        <SelectItem value="4">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Department</label>
                                <Select value={filters.dept} onValueChange={(v) => setFilters(prev => ({ ...prev, dept: v }))}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Dept" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Depts</SelectItem>
                                        <SelectItem value="CSE">CSE</SelectItem>
                                        <SelectItem value="ECE">ECE</SelectItem>
                                        <SelectItem value="MECH">MECH</SelectItem>
                                        <SelectItem value="EEE">EEE</SelectItem>
                                        <SelectItem value="CIVIL">CIVIL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Status</label>
                                <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="VACATE">Vacated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Type</label>
                                <Select value={filters.mandoFilter} onValueChange={(v) => setFilters(prev => ({ ...prev, mandoFilter: v }))}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="mando">Mando</SelectItem>
                                        <SelectItem value="regular">Regular</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                        </div>
                    </CardContent>
                </Card>

                {/* Students Table */}
                <StudentsTable filters={filters} />
            </div>
        </div>
    )
}

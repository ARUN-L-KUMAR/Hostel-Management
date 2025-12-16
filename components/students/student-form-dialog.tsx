"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Student {
    id: string
    name: string
    rollNo: string
    dept: string | null
    year: number
    isMando: boolean
    company?: string | null
    status: string
    hostel: { name: string }
}

interface StudentFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    initialData?: Student | null
}

export function StudentFormDialog({ open, onOpenChange, onSuccess, initialData }: StudentFormDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        rollNo: "",
        dept: "",
        year: "",
        hostel: "",
        isMando: false,
        company: "",
        status: "ACTIVE",
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Update form data when initialData or open state changes
    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    rollNo: initialData.rollNo,
                    dept: initialData.dept || "",
                    year: initialData.year.toString(),
                    hostel: initialData.hostel?.name.toLowerCase().includes("boys") ? "boys" : "girls",
                    isMando: initialData.isMando,
                    company: initialData.company || "",
                    status: initialData.status,
                })
            } else {
                // Reset form for adding new student
                setFormData({
                    name: "",
                    rollNo: "",
                    dept: "",
                    year: "",
                    hostel: "",
                    isMando: false,
                    company: "",
                    status: "ACTIVE",
                })
            }
        }
    }, [open, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const url = "/api/students"
            const method = initialData ? "PUT" : "POST"

            const payload: any = {
                name: formData.name,
                rollNumber: formData.rollNo,
                dept: formData.dept,
                hostel: formData.hostel,
                year: formData.year,
                isMando: formData.isMando,
                company: formData.company,
                status: formData.status,
            }

            if (initialData) {
                payload.id = initialData.id
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to ${initialData ? "update" : "create"} student`)
            }

            console.log(`[v0] Student ${initialData ? "updated" : "created"} successfully`)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(`Error ${initialData ? "updating" : "creating"} student:`, error)
            alert(`Failed to ${initialData ? "update" : "create"} student: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isFormValid = formData.name && formData.rollNo && formData.year && formData.hostel

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Student" : "Add New Student"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter student name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rollNo">Reg Number *</Label>
                                <Input
                                    id="rollNo"
                                    value={formData.rollNo}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, rollNo: e.target.value }))}
                                    placeholder="e.g., B21001"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dept">Department</Label>
                                <Input
                                    id="dept"
                                    value={formData.dept}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, dept: e.target.value }))}
                                    placeholder="e.g., CSE, ECE, ME"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="year">Year *</Label>
                                <Select
                                    value={formData.year}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, year: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st Year</SelectItem>
                                        <SelectItem value="2">2nd Year</SelectItem>
                                        <SelectItem value="3">3rd Year</SelectItem>
                                        <SelectItem value="4">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hostel">Hostel *</Label>
                                <Select
                                    value={formData.hostel}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, hostel: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select hostel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boys">Boys Hostel</SelectItem>
                                        <SelectItem value="girls">Girls Hostel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="VACATE">Vacated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Mando Information */}
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isMando">Mando Student</Label>
                                    <p className="text-sm text-muted-foreground">Is this student enrolled in the Mando program?</p>
                                </div>
                                <Switch
                                    id="isMando"
                                    checked={formData.isMando}
                                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isMando: checked }))}
                                />
                            </div>

                            {formData.isMando && (
                                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company Name</Label>
                                        <Input
                                            id="company"
                                            value={formData.company}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isFormValid || isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? "Update Student" : "Add Student"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

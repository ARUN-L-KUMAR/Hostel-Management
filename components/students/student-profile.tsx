"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Building, Calendar, Briefcase, Edit, Save, X } from "lucide-react"

interface StudentProfileProps {
  student: {
    id: string
    name: string
    rollNo: string
    dept?: string | null
    year: number
    isMando: boolean
    company?: string | null
    status: string
    joinDate: Date
    leaveDate?: Date | null
    hostel: {
      name: string
    }
  }
  editable?: boolean
}

export function StudentProfile({ student, editable = false }: StudentProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: student.name,
    rollNo: student.rollNo,
    dept: student.dept || "",
    year: student.year,
    isMando: student.isMando,
    company: student.company || "",
    status: student.status,
  })

  const handleSave = () => {
    console.log("[v0] Saving student profile:", formData)
    // This would make an API call to update the student
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: student.name,
      rollNo: student.rollNo,
      dept: student.dept || "",
      year: student.year,
      isMando: student.isMando,
      company: student.company || "",
      status: student.status,
    })
    setIsEditing(false)
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Student Profile</span>
          </CardTitle>
          {editable && (
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <div className="text-lg font-semibold text-slate-900">{student.name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNo">Roll Number</Label>
              {isEditing ? (
                <Input
                  id="rollNo"
                  value={formData.rollNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rollNo: e.target.value }))}
                />
              ) : (
                <div className="font-medium text-slate-700">{student.rollNo}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              {isEditing ? (
                <Input
                  id="dept"
                  value={formData.dept}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dept: e.target.value }))}
                  placeholder="e.g., CSE, ECE, ME"
                />
              ) : (
                <div className="font-medium text-slate-700">{student.dept || "Not Set"}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              {isEditing ? (
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, year: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium text-slate-700">{student.year}</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hostel</Label>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">{student.hostel.name} Hostel</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="GRADUATED">Graduated</SelectItem>
                    <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant={student.status === "ACTIVE" ? "default" : "secondary"}
                  className={student.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {student.status}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>Join Date</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">{new Date(student.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Mando Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Mando Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Mando Student</Label>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isMando}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isMando: checked }))}
                  />
                  <span className="text-sm text-slate-600">
                    {formData.isMando ? "Yes, this is a Mando student" : "No, regular student"}
                  </span>
                </div>
              ) : (
                <div>
                  {student.isMando ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Mando Student
                    </Badge>
                  ) : (
                    <Badge variant="outline">Regular Student</Badge>
                  )}
                </div>
              )}
            </div>

            {(student.isMando || formData.isMando) && (
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                {isEditing ? (
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Enter company name"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700">{student.company || "Not specified"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {student.isMando && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-800">
                <strong>Mando Billing:</strong> This student's mess bills are covered by the Mando budget. They will not
                be charged individually for meals.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

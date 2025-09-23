"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, AlertTriangle, Download, Send, FileText } from "lucide-react"

interface BillingPublishProps {
  data: {
    totalExpense: number
    totalMandays: number
    perDayRate: number
    mandoCoverage: number
    carryForward: number
    advanceTotal: number
  }
  onBack: () => void
}

export function BillingPublish({ data, onBack }: BillingPublishProps) {
  const [publishChecks, setPublishChecks] = useState({
    dataVerified: false,
    mandoApproved: false,
    backupCreated: false,
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  const canPublish = Object.values(publishChecks).every(Boolean)

  const handlePublish = async () => {
    setIsPublishing(true)

    // Simulate publishing process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setIsPublishing(false)
    setIsPublished(true)

    console.log("[v0] Bills published successfully")
  }

  const publishSummary = {
    totalStudents: 50,
    regularStudents: 38,
    mandoStudents: 12,
    totalRegularBills: 52450.75,
    totalMandoCoverage: 63000,
    totalBilling: 115450.75,
  }

  if (isPublished) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bills Published Successfully!</h2>
          <p className="text-slate-600 mb-6">
            December 2024 billing has been finalized and published. Student bills are now available.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{publishSummary.regularStudents}</div>
              <div className="text-sm text-green-700">Regular Bills</div>
              <div className="text-xs text-green-600">₹{publishSummary.totalRegularBills.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{publishSummary.mandoStudents}</div>
              <div className="text-sm text-orange-700">Mando Covered</div>
              <div className="text-xs text-orange-600">₹{publishSummary.totalMandoCoverage.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">₹{publishSummary.totalBilling.toLocaleString()}</div>
              <div className="text-sm text-blue-700">Total Billing</div>
              <div className="text-xs text-blue-600">All students</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download Reports
            </Button>
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Send Notifications
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Bills
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Final Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Final Billing Summary - December 2024</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Financial Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="font-medium">₹{data.totalExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Mandays:</span>
                  <span className="font-medium">{data.totalMandays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Per-Day Rate:</span>
                  <span className="font-medium">₹{data.perDayRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mando Coverage:</span>
                  <span className="font-medium">₹{data.mandoCoverage.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Student Distribution</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Students:</span>
                  <span className="font-medium">{publishSummary.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Regular Students:</span>
                  <span className="font-medium">{publishSummary.regularStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mando Students:</span>
                  <span className="font-medium text-orange-600">{publishSummary.mandoStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Billing:</span>
                  <span className="font-medium">₹{publishSummary.totalBilling.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-publish Checklist */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Pre-publish Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dataVerified"
              checked={publishChecks.dataVerified}
              onCheckedChange={(checked) => setPublishChecks((prev) => ({ ...prev, dataVerified: checked as boolean }))}
            />
            <label htmlFor="dataVerified" className="text-sm font-medium">
              I have verified all attendance data and expense calculations
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="mandoApproved"
              checked={publishChecks.mandoApproved}
              onCheckedChange={(checked) =>
                setPublishChecks((prev) => ({ ...prev, mandoApproved: checked as boolean }))
              }
            />
            <label htmlFor="mandoApproved" className="text-sm font-medium">
              Mando coverage amounts have been approved by management
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="backupCreated"
              checked={publishChecks.backupCreated}
              onCheckedChange={(checked) =>
                setPublishChecks((prev) => ({ ...prev, backupCreated: checked as boolean }))
              }
            />
            <label htmlFor="backupCreated" className="text-sm font-medium">
              Database backup has been created before publishing
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Once published, bills cannot be easily modified. Ensure all data is correct before
          proceeding. This action will:
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Create final student bill records</li>
            <li>• Apply Mando coverage to eligible students</li>
            <li>• Generate billing statements</li>
            <li>• Send notifications to students (if enabled)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Adjustments
        </Button>
        <Button
          onClick={handlePublish}
          disabled={!canPublish || isPublishing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing Bills...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish Bills
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

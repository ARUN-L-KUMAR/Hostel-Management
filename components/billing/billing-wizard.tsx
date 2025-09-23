"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BillingOverview } from "./billing-overview"
import { StudentBillsPreview } from "./student-bills-preview"
import { BillingAdjustments } from "./billing-adjustments"
import { BillingPublish } from "./billing-publish"
import { CheckCircle, Circle } from "lucide-react"

const steps = [
  { id: "overview", label: "Overview", icon: Circle },
  { id: "preview", label: "Preview Bills", icon: Circle },
  { id: "adjustments", label: "Adjustments", icon: Circle },
  { id: "publish", label: "Publish", icon: Circle },
]

export function BillingWizard() {
  const [currentStep, setCurrentStep] = useState("overview")
  const [billingData, setBillingData] = useState({
    totalExpense: 76700,
    totalMandays: 1550,
    perDayRate: 49.48,
    mandoCoverage: 70250,
    carryForward: 15000,
    advanceTotal: 8500,
  })

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId)
    const currentIndex = steps.findIndex((s) => s.id === currentStep)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "current"
    return "upcoming"
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Billing Wizard - December 2024</span>
            <Badge variant="secondary">Draft</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id)
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        status === "completed"
                          ? "bg-green-500 border-green-500 text-white"
                          : status === "current"
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white border-slate-300 text-slate-400"
                      }`}
                    >
                      {status === "completed" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </button>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        status === "current" ? "text-blue-600" : "text-slate-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${status === "completed" ? "bg-green-500" : "bg-slate-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Tabs value={currentStep} onValueChange={setCurrentStep}>
        <TabsContent value="overview">
          <BillingOverview data={billingData} onNext={() => setCurrentStep("preview")} />
        </TabsContent>
        <TabsContent value="preview">
          <StudentBillsPreview
            data={billingData}
            onNext={() => setCurrentStep("adjustments")}
            onBack={() => setCurrentStep("overview")}
          />
        </TabsContent>
        <TabsContent value="adjustments">
          <BillingAdjustments
            data={billingData}
            onDataChange={setBillingData}
            onNext={() => setCurrentStep("publish")}
            onBack={() => setCurrentStep("preview")}
          />
        </TabsContent>
        <TabsContent value="publish">
          <BillingPublish data={billingData} onBack={() => setCurrentStep("adjustments")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

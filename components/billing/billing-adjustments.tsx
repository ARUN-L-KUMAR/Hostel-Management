"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, AlertTriangle, Info } from "lucide-react"

interface BillingAdjustmentsProps {
  data: {
    totalExpense: number
    totalMandays: number
    perDayRate: number
    mandoCoverage: number
    carryForward: number
    advanceTotal: number
  }
  onDataChange: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function BillingAdjustments({ data, onDataChange, onNext, onBack }: BillingAdjustmentsProps) {
  const [adjustments, setAdjustments] = useState({
    carryForward: data.carryForward,
    advanceTotal: data.advanceTotal,
    mandoBoysAmount: 58200,
    mandoGirlsAmount: 12052,
    mandoTotalAmount: 70250,
    perMealRate: 50,
    mealsPerDay: 2,
  })

  const handleAdjustmentChange = (field: string, value: number) => {
    const newAdjustments = { ...adjustments, [field]: value }
    setAdjustments(newAdjustments)

    // Recalculate per-day rate
    const netExpense = data.totalExpense - newAdjustments.carryForward - newAdjustments.advanceTotal
    const newPerDayRate = data.totalMandays > 0 ? netExpense / data.totalMandays : 0

    onDataChange({
      ...data,
      carryForward: newAdjustments.carryForward,
      advanceTotal: newAdjustments.advanceTotal,
      perDayRate: newPerDayRate,
      mandoCoverage: newAdjustments.mandoTotalAmount,
    })
  }

  const mandoUtilization = {
    boys: 45000, // Mock data - actual coverage for boys
    girls: 18000, // Mock data - actual coverage for girls
  }

  const mandoRemaining = {
    boys: adjustments.mandoBoysAmount - mandoUtilization.boys,
    girls: adjustments.mandoGirlsAmount - mandoUtilization.girls,
    total: adjustments.mandoTotalAmount - (mandoUtilization.boys + mandoUtilization.girls),
  }

  return (
    <div className="space-y-6">
      {/* Billing Adjustments */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Billing Adjustments</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Financial Adjustments */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Financial Adjustments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carryForward">Carry Forward Amount</Label>
                <Input
                  id="carryForward"
                  type="number"
                  value={adjustments.carryForward}
                  onChange={(e) => handleAdjustmentChange("carryForward", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Amount carried forward from previous month</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="advanceTotal">Total Advances</Label>
                <Input
                  id="advanceTotal"
                  type="number"
                  value={adjustments.advanceTotal}
                  onChange={(e) => handleAdjustmentChange("advanceTotal", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Total advance payments received</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Mando Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Mando Coverage Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mandoBoysAmount">Boys Mando Amount</Label>
                <Input
                  id="mandoBoysAmount"
                  type="number"
                  value={adjustments.mandoBoysAmount}
                  onChange={(e) => handleAdjustmentChange("mandoBoysAmount", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Budget for boys Mando students</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mandoGirlsAmount">Girls Mando Amount</Label>
                <Input
                  id="mandoGirlsAmount"
                  type="number"
                  value={adjustments.mandoGirlsAmount}
                  onChange={(e) => handleAdjustmentChange("mandoGirlsAmount", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Budget for girls Mando students</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mandoTotalAmount">Total Mando Budget</Label>
                <Input
                  id="mandoTotalAmount"
                  type="number"
                  value={adjustments.mandoTotalAmount}
                  onChange={(e) => handleAdjustmentChange("mandoTotalAmount", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Total Mando coverage budget</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perMealRate">Per Meal Rate</Label>
                <Input
                  id="perMealRate"
                  type="number"
                  value={adjustments.perMealRate}
                  onChange={(e) => handleAdjustmentChange("perMealRate", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Rate per meal for Mando calculation</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mealsPerDay">Meals Per Day</Label>
                <Input
                  id="mealsPerDay"
                  type="number"
                  min="2"
                  max="3"
                  value={adjustments.mealsPerDay}
                  onChange={(e) => handleAdjustmentChange("mealsPerDay", Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">Number of meals served per day</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mando Utilization Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Mando Budget Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Boys Hostel</div>
              <div className="text-2xl font-bold text-blue-900">₹{mandoUtilization.boys.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Used of ₹{adjustments.mandoBoysAmount.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">₹{mandoRemaining.boys.toLocaleString()} remaining</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <div className="text-sm font-medium text-pink-800">Girls Hostel</div>
              <div className="text-2xl font-bold text-pink-900">₹{mandoUtilization.girls.toLocaleString()}</div>
              <div className="text-xs text-pink-600">Used of ₹{adjustments.mandoGirlsAmount.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">₹{mandoRemaining.girls.toLocaleString()} remaining</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium text-slate-800">Total Budget</div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{(mandoUtilization.boys + mandoUtilization.girls).toLocaleString()}
              </div>
              <div className="text-xs text-slate-600">Used of ₹{adjustments.mandoTotalAmount.toLocaleString()}</div>
              <div className="text-xs text-green-600 mt-1">₹{mandoRemaining.total.toLocaleString()} remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {mandoRemaining.total < 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Mando budget exceeded by ₹{Math.abs(mandoRemaining.total).toLocaleString()}.
            Please adjust the budget or review Mando student bills.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Changes to these settings will recalculate all student bills. The new per-day rate will
          be ₹{data.perDayRate.toFixed(2)} based on your adjustments.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Preview
        </Button>
        <Button onClick={onNext}>Proceed to Publish</Button>
      </div>
    </div>
  )
}

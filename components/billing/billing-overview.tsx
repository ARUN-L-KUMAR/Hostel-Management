"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Calendar, TrendingUp, Users, AlertTriangle, Info } from "lucide-react"

interface BillingOverviewProps {
  data: {
    totalExpense: number
    totalMandays: number
    perDayRate: number
    mandoCoverage: number
    carryForward: number
    advanceTotal: number
  }
  onNext: () => void
}

export function BillingOverview({ data, onNext }: BillingOverviewProps) {
  const kpiCards = [
    {
      title: "Total Expenses",
      value: `₹${data.totalExpense.toLocaleString()}`,
      icon: DollarSign,
      description: "Labour + Provisions + Utilities + Other",
    },
    {
      title: "Total Mandays",
      value: data.totalMandays.toString(),
      icon: Calendar,
      description: "Present days across all students",
    },
    {
      title: "Per-Day Rate",
      value: `₹${data.perDayRate.toFixed(2)}`,
      icon: TrendingUp,
      description: "Cost per student per day",
    },
    {
      title: "Mando Coverage",
      value: `₹${data.mandoCoverage.toLocaleString()}`,
      icon: Users,
      description: "Fixed amount for Mando students",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing Formula */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Billing Calculation Formula</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="font-medium">₹{data.totalExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Carry Forward:</span>
                <span className="font-medium">₹{data.carryForward.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Advance Total:</span>
                <span className="font-medium">₹{data.advanceTotal.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Net Amount:</span>
                <span>₹{(data.totalExpense - data.carryForward - data.advanceTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>÷ Total Mandays:</span>
                <span className="font-medium">{data.totalMandays}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-blue-600">
                <span>Per-Day Rate:</span>
                <span>₹{data.perDayRate.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Mando Student Billing:</strong> Mando students will have their bills covered by the fixed Mando
              amount (₹70,250). Their individual bills will show ₹0 due, and the coverage will be deducted from the mess
              budget.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Expense Breakdown - December 2024</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-medium">Labour Charges</span>
              <span className="font-semibold">₹33,000</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-medium">Provision Costs</span>
              <span className="font-semibold">₹35,000</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-medium">Utilities</span>
              <span className="font-semibold">₹4,700</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-medium">Maintenance</span>
              <span className="font-semibold">₹2,500</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-medium">Other Expenses</span>
              <span className="font-semibold">₹1,500</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={onNext} size="lg">
          Preview Student Bills
        </Button>
      </div>
    </div>
  )
}

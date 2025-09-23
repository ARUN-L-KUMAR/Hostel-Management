"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ProvisionsChartClientProps {
  topProvisionsData: Array<{
    name: string
    cost: number
    usage: number
  }>
  costDistributionData: Array<{
    name: string
    value: number
    color: string
  }>
}

export function ProvisionsChartClient({ topProvisionsData, costDistributionData }: ProvisionsChartClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 5 Provisions by Cost */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Top 5 Provisions by Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProvisionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                formatter={(value, name) => [
                  name === "cost" ? `₹${value}` : `${value} kg`,
                  name === "cost" ? "Cost" : "Usage",
                ]}
                labelStyle={{ color: "#1e293b" }}
              />
              <Bar dataKey="cost" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Distribution */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Cost Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {costDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {costDistributionData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
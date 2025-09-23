"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const mandaysData = [
  { month: "Jul", mandays: 1450 },
  { month: "Aug", mandays: 1520 },
  { month: "Sep", mandays: 1380 },
  { month: "Oct", mandays: 1490 },
  { month: "Nov", mandays: 1420 },
  { month: "Dec", mandays: 1550 },
]

export function MandaysChart() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Mandays Trend (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mandaysData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip formatter={(value) => [value, "Mandays"]} labelStyle={{ color: "#1e293b" }} />
            <Bar dataKey="mandays" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

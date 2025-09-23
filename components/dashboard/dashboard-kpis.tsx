import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar, TrendingUp, ArrowUpRight, CreditCard } from "lucide-react"
import { prisma } from "@/lib/db"

async function getDashboardKPIs() {
  const currentMonth = "2024-12"

  // Get total expenses for current month
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: new Date(`${currentMonth}-01`),
        lt: new Date(`${currentMonth}-31`),
      },
    },
  })

  const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  // Get total mandays from attendance
  const attendanceCount = await prisma.attendance.count({
    where: {
      date: {
        gte: new Date(`${currentMonth}-01`),
        lt: new Date(`${currentMonth}-31`),
      },
      code: "P", // Only present days count as mandays
    },
  })

  // Calculate per-day rate
  const perDayRate = attendanceCount > 0 ? totalExpense / attendanceCount : 0

  // Mock data for other KPIs
  const carryForward = 15000
  const advanceBalance = 8500

  return {
    totalExpense,
    totalMandays: attendanceCount,
    perDayRate,
    carryForward,
    advanceBalance,
  }
}

export async function DashboardKPIs() {
  const kpis = await getDashboardKPIs()

  const kpiCards = [
    {
      title: "Total Expense",
      value: `₹${kpis.totalExpense.toLocaleString()}`,
      icon: DollarSign,
      change: "+12.5%",
      changeType: "increase" as const,
    },
    {
      title: "Total Mandays",
      value: kpis.totalMandays.toString(),
      icon: Calendar,
      change: "+5.2%",
      changeType: "increase" as const,
    },
    {
      title: "Per-Day Rate",
      value: `₹${Math.round(kpis.perDayRate)}`,
      icon: TrendingUp,
      change: "+8.1%",
      changeType: "increase" as const,
    },
    {
      title: "Carry Forward",
      value: `₹${kpis.carryForward.toLocaleString()}`,
      icon: ArrowUpRight,
      change: "-2.3%",
      changeType: "decrease" as const,
    },
    {
      title: "Advance Balance",
      value: `₹${kpis.advanceBalance.toLocaleString()}`,
      icon: CreditCard,
      change: "+15.7%",
      changeType: "increase" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiCards.map((kpi) => (
        <Card key={kpi.title} className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <p
              className={`text-xs flex items-center mt-1 ${
                kpi.changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}
            >
              {kpi.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

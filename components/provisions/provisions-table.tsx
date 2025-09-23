import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, TrendingUp, TrendingDown } from "lucide-react"

async function getProvisionsData() {
  const provisions = await prisma.provisionItem.findMany({
    include: {
      usage: {
        where: {
          date: {
            gte: new Date("2024-12-01"),
            lte: new Date("2024-12-31"),
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  // Calculate monthly usage and costs
  const provisionsWithStats = provisions.map((provision) => {
    // Safe access to usage data with fallback to empty array
    const usage = provision.usage || []
    const monthlyUsage = usage.reduce((sum: number, usageItem: any) => sum + Number(usageItem.quantity), 0)
    const monthlyCost = monthlyUsage * Number(provision.unitCost)

    return {
      ...provision,
      stats: {
        monthlyUsage,
        monthlyCost,
        avgDailyUsage: monthlyUsage / 31,
      },
    }
  })

  return provisionsWithStats
}

export async function ProvisionsTable() {
  const provisions = await getProvisionsData()

  const totalMonthlyCost = provisions.reduce((sum, p) => sum + p.stats.monthlyCost, 0)

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Provision Items ({provisions.length})</CardTitle>
          <div className="text-sm text-slate-600">
            Total Monthly Cost: <span className="font-semibold">₹{totalMonthlyCost.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Monthly Usage</TableHead>
              <TableHead className="text-right">Monthly Cost</TableHead>
              <TableHead className="text-right">Avg Daily Usage</TableHead>
              <TableHead className="text-right">Trend</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {provisions.map((provision) => {
              const costPercentage = (provision.stats.monthlyCost / totalMonthlyCost) * 100
              const isHighCost = costPercentage > 10

              return (
                <TableRow key={provision.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{provision.name}</div>
                      <div className="text-sm text-slate-500">{provision.unitMeasure}</div>
                    </div>
                  </TableCell>
                  <TableCell>{provision.unit}</TableCell>
                  <TableCell className="text-right">₹{Number(provision.unitCost).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{provision.stats.monthlyUsage.toFixed(1)}</div>
                    <div className="text-sm text-slate-500">{provision.unit}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">₹{provision.stats.monthlyCost.toFixed(2)}</div>
                    {isHighCost && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                        High Cost
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {provision.stats.avgDailyUsage.toFixed(2)} {provision.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Mock trend - in real app this would be calculated from historical data */}
                    {Math.random() > 0.5 ? (
                      <div className="flex items-center justify-end text-green-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span className="text-sm">-5%</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end text-red-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">+8%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
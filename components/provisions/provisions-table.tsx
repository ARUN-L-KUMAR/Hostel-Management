"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { EditProvisionDialog } from "./edit-provision-dialog"

interface Provision {
  id: string
  name: string
  unit: string
  unitCost: string
  unitMeasure: string
  usage?: Array<{
    quantity: number
    date: string
  }>
  stats?: {
    monthlyUsage: number
    monthlyCost: number
    avgDailyUsage: number
  }
}

export function ProvisionsTable() {
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedProvision, setSelectedProvision] = useState<Provision | null>(null)

  const fetchProvisions = async () => {
    setLoading(true)
    try {
      const response = await ApiClient.provisions.getAll()

      // Calculate monthly usage and costs for December 2024
      const provisionsWithStats = response.map((provision: Provision) => {
        // Filter usage for December 2024
        const decemberUsage = provision.usage?.filter((usage: any) => {
          const usageDate = new Date(usage.date)
          return usageDate.getMonth() === 11 && usageDate.getFullYear() === 2024 // December is month 11
        }) || []

        const monthlyUsage = decemberUsage.reduce((sum: number, usageItem: any) => sum + Number(usageItem.quantity), 0)
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

      setProvisions(provisionsWithStats)
    } catch (error) {
      console.error("Error fetching provisions:", error)
      setProvisions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProvisions()
  }, [])

  const handleEditClick = (provision: Provision) => {
    setSelectedProvision(provision)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchProvisions() // Refresh the table data
  }

  const totalMonthlyCost = provisions.reduce((sum, p: any) => sum + p.stats?.monthlyCost || 0, 0)

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Loading Provisions...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
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
              <TableHead>Quantity(units)</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Monthly Usage</TableHead>
              <TableHead className="text-right">Monthly Cost</TableHead>
              <TableHead className="text-right">Avg Daily Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {provisions.map((provision) => {
              const monthlyCost = provision.stats?.monthlyCost || 0
              const costPercentage = totalMonthlyCost > 0 ? (monthlyCost / totalMonthlyCost) * 100 : 0
              const isHighCost = costPercentage > 10

              return (
                <TableRow key={provision.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{provision.name}</div>
                  </TableCell>
                  <TableCell>{provision.unitMeasure}</TableCell>
                  <TableCell className="text-right">₹{Number(provision.unitCost).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{(provision.stats?.monthlyUsage || 0).toFixed(1)}</div>
                    <div className="text-sm text-slate-500">{provision.unit}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">₹{monthlyCost.toFixed(2)}</div>
                    {isHighCost && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                        High Cost
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {(provision.stats?.avgDailyUsage || 0).toFixed(2)} {provision.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(provision)}>
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
    
    <EditProvisionDialog
      provision={selectedProvision}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={handleEditSuccess}
    />
  </>
  )
}
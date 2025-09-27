"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, ArrowUp } from "lucide-react"
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
    avgDailyUsage: number
    inInventory: number
    totalPurchased: number
    totalUsed: number
  }
}

export function ProvisionsTable() {
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedProvision, setSelectedProvision] = useState<Provision | null>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  const fetchProvisions = async () => {
    setLoading(true)
    try {
      // Fetch provisions
      const provisionsResponse = await ApiClient.provisions.getAll()

      // Fetch all provision usage
      const usageResponse = await fetch('/api/provision-usage')

      let usageData: any[] = []
      if (usageResponse.ok) {
        usageData = await usageResponse.json()
      }

      // Fetch all provision purchases
      const purchasesResponse = await fetch('/api/provision-purchases')

      let purchasesData: any[] = []
      if (purchasesResponse.ok) {
        purchasesData = await purchasesResponse.json()
      }

      // Group usage by provisionItemId
      const usageByProvision = usageData.reduce((acc: Record<string, any[]>, usage: any) => {
        const provisionId = usage.provisionItemId || usage.provisionItem?.id
        if (!acc[provisionId]) {
          acc[provisionId] = []
        }
        acc[provisionId].push(usage)
        return acc
      }, {})

      // Group purchases by provisionItemId
      const purchasesByProvision = purchasesData.reduce((acc: Record<string, number>, purchase: any) => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((item: any) => {
            const provisionId = item.provisionItem?.id
            if (provisionId) {
              if (!acc[provisionId]) {
                acc[provisionId] = 0
              }
              acc[provisionId] += Number(item.quantity)
            }
          })
        }
        return acc
      }, {})

      // Calculate average daily usage and inventory from all provision usage and purchase data
      const provisionsWithStats = provisionsResponse.map((provision: Provision) => {
        const usageRecords = usageByProvision[provision.id] || []
        const totalQuantityUsed = usageRecords.reduce((sum: number, usageItem: any) => sum + Number(usageItem.quantity), 0)
        const totalUsageCount = usageRecords.length
        const avgDailyUsage = totalUsageCount > 0 ? totalQuantityUsed / totalUsageCount : 0

        const totalPurchased = purchasesByProvision[provision.id] || 0
        const inInventory = totalPurchased - totalQuantityUsed

        return {
          ...provision,
          stats: {
            avgDailyUsage,
            inInventory,
            totalPurchased,
            totalUsed: totalQuantityUsed,
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

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowScrollToTop(scrollY > 300) // Show button after scrolling 300px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleEditClick = (provision: Provision) => {
    setSelectedProvision(provision)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchProvisions() // Refresh the table data
  }

  // No total cost calculation needed since we removed monthly cost

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
        <CardTitle>Provision Items ({provisions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Quantity(units)</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">In Inventory</TableHead>
              <TableHead className="text-right">Avg Daily Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {provisions.map((provision) => (
              <TableRow key={provision.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">{provision.name}</div>
                </TableCell>
                <TableCell>{provision.unitMeasure}</TableCell>
                <TableCell className="text-right">₹{Number(provision.unitCost).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <span className={`${(provision.stats?.inInventory || 0) < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}>
                    {(provision.stats?.inInventory || 0).toFixed(2)} {provision.unit}
                  </span>
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
            ))}
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
    
    {/* Scroll to Top Button */}
    {showScrollToTop && (
      <Button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ease-in-out transform hover:scale-110"
        size="icon"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    )}
  </>
  )
}
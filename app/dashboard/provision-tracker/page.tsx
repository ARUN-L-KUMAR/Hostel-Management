"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Calendar, TrendingUp, ShoppingCart, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProvisionItem {
  id: string
  name: string
  unit: string
  unitCost: number
  unitMeasure: string
}

interface ProvisionUsage {
   id: string
   provisionItem: ProvisionItem
   date: string
   fromDate?: string
   toDate?: string
   quantity: number
}

interface ProvisionPurchase {
  id: string
  date: string
  vendor: string
  paymentType: string
  billId?: string
  totalAmount: number
  items: ProvisionPurchaseItem[]
  createdAt: string
}

interface ProvisionPurchaseItem {
  id: string
  provisionItem: ProvisionItem
  quantity: number
  unitCost: number
  total: number
}

export default function ProvisionTrackerPage() {
  const { toast } = useToast()
  const [provisionItems, setProvisionItems] = useState<ProvisionItem[]>([])
  const [usages, setUsages] = useState<ProvisionUsage[]>([])
  const [purchases, setPurchases] = useState<ProvisionPurchase[]>([])
  const [loading, setLoading] = useState(false)
  const [usageDialogOpen, setUsageDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [editingUsage, setEditingUsage] = useState<ProvisionUsage | null>(null)
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [usageType, setUsageType] = useState<"day" | "week" | "month">("day")
  const [quantity, setQuantity] = useState("")
  const [quantityUnit, setQuantityUnit] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Purchase states
  const [purchaseItems, setPurchaseItems] = useState<Array<{
    provisionItemId: string
    quantity: string
    unit: string
    unitCost: string
    total: number
  }>>([])
  const [vendor, setVendor] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [billId, setBillId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  const getAvailableUnits = (unit: string) => {
    if (unit === 'kg') return ['kg', 'gm']
    if (unit === 'ltr') return ['ltr', 'ml']
    return [unit]
  }

  const convertQuantity = (quantity: number, fromUnit: string, toUnit: string) => {
    if (fromUnit === toUnit) return quantity
    if (fromUnit === 'gm' && toUnit === 'kg') return quantity / 1000
    if (fromUnit === 'ml' && toUnit === 'ltr') return quantity / 1000
    return quantity
  }

  const fetchProvisionItems = async () => {
    try {
      const response = await fetch('/api/provisions')
      if (response.ok) {
        const data = await response.json()
        setProvisionItems(data)
      }
    } catch (error) {
      console.error("Error fetching provision items:", error)
    }
  }

  const fetchUsages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      })
      const response = await fetch(`/api/provision-usage?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsages(data)
      }
    } catch (error) {
      console.error("Error fetching usages:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      })
      const response = await fetch(`/api/provision-purchases?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched purchases:", data)
        setPurchases(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch purchases:", response.status)
        setPurchases([])
      }
    } catch (error) {
      console.error("Error fetching purchases:", error)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  const saveUsage = async () => {
    if (!selectedItem || !quantity || !quantityUnit) return

    try {
      const item = provisionItems.find(p => p.id === selectedItem)
      if (!item) return

      const convertedQuantity = convertQuantity(parseFloat(quantity), quantityUnit, item.unit)

      let usageDate: string
      let fromDate: string | undefined
      let toDate: string | undefined
      let periodDescription: string

      if (usageType === "day") {
        usageDate = startDate
        fromDate = startDate
        toDate = startDate
        periodDescription = `on ${startDate}`
      } else if (usageType === "week") {
        usageDate = startDate
        fromDate = startDate
        const endOfWeek = new Date(startDate)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        toDate = endOfWeek.toISOString().split('T')[0]
        periodDescription = `for the week ${startDate} to ${toDate}`
      } else if (usageType === "month") {
        usageDate = startDate
        fromDate = startDate
        toDate = endDate
        periodDescription = `for the month ${startDate} to ${endDate}`
      } else {
        usageDate = startDate
        fromDate = startDate
        toDate = startDate
        periodDescription = `on ${startDate}`
      }

      const method = editingUsage ? 'PUT' : 'POST'
      const body = editingUsage
        ? {
            id: editingUsage.id,
            provisionItemId: selectedItem,
            date: usageDate,
            fromDate,
            toDate,
            quantity: convertedQuantity
          }
        : {
            provisionItemId: selectedItem,
            date: usageDate,
            fromDate,
            toDate,
            quantity: convertedQuantity
          }

      await fetch('/api/provision-usage', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      toast({
        title: editingUsage ? "Usage Updated" : "Usage Added",
        description: `${editingUsage ? 'Updated' : 'Added'} ${quantity} ${quantityUnit} of ${item.name} ${periodDescription}`,
      })

      setUsageDialogOpen(false)
      resetForm()
      fetchUsages()
    } catch (error) {
      console.error("Error saving usage:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingUsage ? 'update' : 'add'} usage`,
        variant: "destructive",
      })
    }
  }

  const savePurchase = async () => {
    if (!vendor || !paymentType || purchaseItems.length === 0) return

    try {
      const items = purchaseItems.map(item => {
        const selectedItem = provisionItems.find(p => p.id === item.provisionItemId)
        if (!selectedItem) throw new Error("Invalid item selected")

        // Convert quantity to base unit if different
        const convertedQuantity = convertQuantity(parseFloat(item.quantity), item.unit, selectedItem.unit)

        return {
          provisionItemId: item.provisionItemId,
          quantity: convertedQuantity,
          unitCost: parseFloat(item.unitCost),
          total: item.total
        }
      })

      await fetch('/api/provision-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: purchaseDate,
          vendor,
          paymentType,
          billId: billId || null,
          items
        })
      })

      toast({
        title: "Purchase Added",
        description: `Purchase from ${vendor} added successfully`,
      })

      setPurchaseDialogOpen(false)
      resetPurchaseForm()
      fetchPurchases()
    } catch (error) {
      console.error("Error saving purchase:", error)
      toast({
        title: "Error",
        description: "Failed to add purchase",
        variant: "destructive",
      })
    }
  }

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      provisionItemId: "",
      quantity: "",
      unit: "",
      unitCost: "",
      total: 0
    }])
  }

  const updatePurchaseItem = (index: number, field: string, value: string) => {
    const updatedItems = [...purchaseItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === 'provisionItemId') {
      // When item is selected, auto-fill unit cost, unit, and reset quantity
      const selectedItem = provisionItems.find(item => item.id === value)
      if (selectedItem) {
        updatedItems[index].unitCost = selectedItem.unitCost.toString()
        updatedItems[index].unit = selectedItem.unit
        updatedItems[index].quantity = "" // Reset quantity when item changes
      }
    }

    if (field === 'quantity' || field === 'unitCost' || field === 'provisionItemId') {
      const qty = parseFloat(updatedItems[index].quantity || '0')
      const cost = parseFloat(updatedItems[index].unitCost || '0')
      updatedItems[index].total = qty * cost
    }

    setPurchaseItems(updatedItems)
  }

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const resetPurchaseForm = () => {
    setPurchaseItems([])
    setVendor("")
    setPaymentType("")
    setBillId("")
    setPurchaseDate(new Date().toISOString().split('T')[0])
  }

  const resetForm = () => {
    setEditingUsage(null)
    setSelectedItem("")
    setUsageType("day")
    setQuantity("")
    setQuantityUnit("")
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate(new Date().toISOString().split('T')[0])
  }

  const editUsage = (usage: ProvisionUsage) => {
    setEditingUsage(usage)
    setSelectedItem(usage.provisionItem.id)
    setQuantity(usage.quantity.toString())
    setQuantityUnit(usage.provisionItem.unit)
    setStartDate(usage.fromDate || usage.date)
    setEndDate(usage.toDate || usage.date)
    // Determine usage type based on dates
    if (usage.fromDate && usage.toDate && usage.fromDate !== usage.toDate) {
      const from = new Date(usage.fromDate)
      const to = new Date(usage.toDate)
      const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 6) {
        setUsageType("week")
      } else if (diffDays > 6) {
        setUsageType("month")
      } else {
        setUsageType("day")
      }
    } else {
      setUsageType("day")
    }
    setUsageDialogOpen(true)
  }

  useEffect(() => {
    fetchProvisionItems()
  }, [])

  useEffect(() => {
    fetchUsages()
    fetchPurchases()
  }, [startDate, endDate])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provision Tracker</h1>
          <p className="text-slate-600">Track provision purchases and usage</p>
        </div>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger
            value="purchase"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Provision Purchase</span>
            <span className="sm:hidden">Purchase</span>
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Provision Usage</span>
            <span className="sm:hidden">Usage</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-6">
          {/* Date Range Filter */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Purchase Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Purchase Button */}
          <div className="flex justify-end">
            <Dialog open={purchaseDialogOpen} onOpenChange={(open) => {
              setPurchaseDialogOpen(open)
              if (!open) resetPurchaseForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Provision Purchase</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>

                  {/* Purchase Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Purchase Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                    {purchaseItems.map((item, index) => {
                      const selectedItem = provisionItems.find(p => p.id === item.provisionItemId)
                      const availableUnits = selectedItem ? getAvailableUnits(selectedItem.unit) : []

                      return (
                        <div key={index} className="grid grid-cols-6 gap-2 p-2 border rounded">
                          <div>
                            <Select
                              value={item.provisionItemId}
                              onValueChange={(value) => updatePurchaseItem(index, 'provisionItemId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {provisionItems.map(provItem => (
                                  <SelectItem key={provItem.id} value={provItem.id}>
                                    {provItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                              className="flex-1"
                            />
                            <Select
                              value={item.unit}
                              onValueChange={(value) => updatePurchaseItem(index, 'unit', value)}
                              disabled={!selectedItem}
                            >
                              <SelectTrigger className="w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableUnits.map(unit => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Unit Cost"
                              value={item.unitCost}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Total"
                              value={item.total.toFixed(2)}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePurchaseItem(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input
                        id="vendor"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        placeholder="Vendor name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentType">Payment Type</Label>
                      <Select value={paymentType} onValueChange={setPaymentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="billId">Bill ID (Optional)</Label>
                      <Input
                        id="billId"
                        value={billId}
                        onChange={(e) => setBillId(e.target.value)}
                        placeholder="Bill ID"
                      />
                    </div>
                  </div>

                  <Button onClick={savePurchase} className="w-full">
                    Save Purchase
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Purchase History Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Payment Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(purchases) && purchases.length > 0 ? (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.vendor}</TableCell>
                        <TableCell>
                          {Array.isArray(purchase.items) && purchase.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.provisionItem?.name || 'Unknown'}: {item.quantity} × ₹{parseFloat(String(item.unitCost || 0)).toFixed(2)}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">₹{parseFloat(String(purchase.totalAmount || 0)).toFixed(2)}</TableCell>
                        <TableCell>{purchase.paymentType}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No purchases found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Date Range Filter */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Usage Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Usage Button */}
          <div className="flex justify-end">
            <Dialog open={usageDialogOpen} onOpenChange={(open) => {
              setUsageDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>{editingUsage ? "Edit Provision Usage" : "Add Provision Usage"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item">Provision Item</Label>
                    <Select
                      value={selectedItem}
                      onValueChange={(value) => {
                        setSelectedItem(value)
                        const item = provisionItems.find(p => p.id === value)
                        if (item) {
                          setQuantityUnit(item.unit)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {provisionItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Usage Type</Label>
                    <Select value={usageType} onValueChange={(value: "day" | "week" | "month") => setUsageType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedItem && getAvailableUnits(provisionItems.find(p => p.id === selectedItem)?.unit || "").map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {usageType === "day" && (
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  )}
                  {usageType === "week" && (
                    <div>
                      <Label htmlFor="weekStart">Week Starting</Label>
                      <Input
                        id="weekStart"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  )}
                  {usageType === "month" && (
                    <>
                      <div>
                        <Label htmlFor="monthStart">Start Date</Label>
                        <Input
                          id="monthStart"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthEnd">End Date</Label>
                        <Input
                          id="monthEnd"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <Button onClick={saveUsage} className="w-full">
                    {editingUsage ? "Update Usage" : "Add Usage"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Usage Table */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Provision Usage Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Provision Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((usage) => {
                    const period = usage.fromDate && usage.toDate && usage.fromDate !== usage.toDate
                      ? `${new Date(usage.fromDate).toLocaleDateString()} - ${new Date(usage.toDate).toLocaleDateString()}`
                      : new Date(usage.date).toLocaleDateString()
                    return (
                      <TableRow key={usage.id}>
                        <TableCell>{period}</TableCell>
                        <TableCell>{usage.provisionItem.name}</TableCell>
                        <TableCell>{usage.provisionItem.unit}</TableCell>
                        <TableCell className="text-right">{usage.quantity}</TableCell>
                        <TableCell className="text-right">
                          ₹{(usage.quantity * usage.provisionItem.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => editUsage(usage)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
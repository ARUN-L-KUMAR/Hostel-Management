"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ShoppingCart, BarChart3, Package, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ApiClient } from "@/lib/api-client"

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

export default function ProvisionsPage() {
  const { toast } = useToast()
  const [provisionItems, setProvisionItems] = useState<ProvisionItem[]>([])
  const [usages, setUsages] = useState<ProvisionUsage[]>([])
  const [purchases, setPurchases] = useState<ProvisionPurchase[]>([])
  const [inventoryLevels, setInventoryLevels] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [usageDialogOpen, setUsageDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [editingUsage, setEditingUsage] = useState<ProvisionUsage | null>(null)
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [usageType, setUsageType] = useState<"day" | "week" | "month">("day")
  const [quantity, setQuantity] = useState("")
  const [quantityUnit, setQuantityUnit] = useState("")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Separate state for dialog dates to avoid conflicts
  const [dialogStartDate, setDialogStartDate] = useState('')
  const [dialogEndDate, setDialogEndDate] = useState('')
  const [quantityError, setQuantityError] = useState("")

  // Purchase states
  const [purchaseItems, setPurchaseItems] = useState<Array<{
    provisionItemName: string
    quantity: string
    unit: string
    unitCost: string
    total: number
  }>>([])
  const [vendor, setVendor] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [billId, setBillId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  // Item name suggestions from purchase history
  const [itemSuggestions, setItemSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Filter states
  const [purchaseFilter, setPurchaseFilter] = useState<string>("all")
  const [usageFilter, setUsageFilter] = useState<string>("all")

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
      const data = await ApiClient.provisions.getAll()
      setProvisionItems(data)
    } catch (error) {
      console.error("Error fetching provision items:", error)
    }
  }

  const fetchItemSuggestions = async () => {
    try {
      const response = await fetch('/api/provision-purchases')
      if (response.ok) {
        const purchasesData = await response.json()
        const uniqueItems = new Set<string>()

        purchasesData.forEach((purchase: any) => {
          if (purchase.items && Array.isArray(purchase.items)) {
            purchase.items.forEach((item: any) => {
              if (item.provisionItem?.name) {
                uniqueItems.add(item.provisionItem.name)
              }
            })
          }
        })

        setItemSuggestions(Array.from(uniqueItems).sort())
      }
    } catch (error) {
      console.error("Error fetching item suggestions:", error)
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

  const calculateInventoryLevels = async () => {
    setInventoryLoading(true)
    try {
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
      const usageByProvision = usageData.reduce((acc: Record<string, number>, usage: any) => {
        const provisionId = usage.provisionItemId || usage.provisionItem?.id
        if (!acc[provisionId]) {
          acc[provisionId] = 0
        }
        acc[provisionId] += Number(usage.quantity)
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

      // Calculate inventory for each provision item
      const inventory: Record<string, number> = {}
      provisionItems.forEach(item => {
        const totalPurchased = purchasesByProvision[item.id] || 0
        const totalUsed = usageByProvision[item.id] || 0
        inventory[item.id] = totalPurchased - totalUsed
      })

      setInventoryLevels(inventory)
    } catch (error) {
      console.error("Error calculating inventory levels:", error)
    } finally {
      setInventoryLoading(false)
    }
  }

  const saveUsage = async () => {
    if (!selectedItem || !quantity || !quantityUnit) return

    // Check for quantity validation error
    if (quantityError) {
      toast({
        title: "Invalid Quantity",
        description: quantityError,
        variant: "destructive",
      })
      return
    }

    try {
      const item = provisionItems.find(p => p.id === selectedItem)
      if (!item) return

      const convertedQuantity = convertQuantity(parseFloat(quantity), quantityUnit, item.unit)
      const availableInventory = inventoryLevels[selectedItem] || 0

      // Check if usage exceeds available inventory (only for new usages, not edits)
      if (!editingUsage && convertedQuantity > availableInventory) {
        toast({
          title: "Insufficient Inventory",
          description: `Cannot use ${convertedQuantity.toFixed(2)} ${item.unit} of ${item.name}. Only ${availableInventory.toFixed(2)} ${item.unit} available.`,
          variant: "destructive",
        })
        return
      }

      let usageDate: string
      let fromDate: string | undefined
      let toDate: string | undefined
      let periodDescription: string

      if (usageType === "day") {
        usageDate = dialogStartDate
        fromDate = dialogStartDate
        toDate = dialogStartDate
        periodDescription = `on ${dialogStartDate}`
      } else if (usageType === "week") {
        usageDate = dialogStartDate
        fromDate = dialogStartDate
        const endOfWeek = new Date(dialogStartDate)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        toDate = endOfWeek.toISOString().split('T')[0]
        periodDescription = `for the week ${dialogStartDate} to ${toDate}`
      } else if (usageType === "month") {
        usageDate = dialogStartDate
        fromDate = dialogStartDate
        toDate = dialogEndDate
        periodDescription = `for the month ${dialogStartDate} to ${dialogEndDate}`
      } else {
        usageDate = dialogStartDate
        fromDate = dialogStartDate
        toDate = dialogStartDate
        periodDescription = `on ${dialogStartDate}`
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
      calculateInventoryLevels() // Recalculate inventory after usage change
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
      // First, create any new provision items that don't exist
      const processedItems = []
      for (const item of purchaseItems) {
        let provisionItemId = null

        // Check if item exists
        const existingItem = provisionItems.find(p => p.name.toLowerCase() === item.provisionItemName.toLowerCase())

        if (existingItem) {
          provisionItemId = existingItem.id
        } else {
          // Create new provision item
          const newItemResponse = await fetch('/api/provisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.provisionItemName,
              unit: item.unit,
              unitCost: parseFloat(item.unitCost),
              unitMeasure: item.unit
            })
          })

          if (newItemResponse.ok) {
            const newItem = await newItemResponse.json()
            provisionItemId = newItem.id
            // Add to local state
            setProvisionItems(prev => [...prev, newItem])
          } else {
            throw new Error(`Failed to create provision item "${item.provisionItemName}"`)
          }
        }

        processedItems.push({
          provisionItemId,
          quantity: parseFloat(item.quantity),
          unitCost: parseFloat(item.unitCost),
          total: item.total
        })
      }

      // Now create the purchase
      await fetch('/api/provision-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: purchaseDate,
          vendor,
          paymentType,
          billId: billId || null,
          items: processedItems
        })
      })

      toast({
        title: "Purchase Added",
        description: `Purchase from ${vendor} added successfully`,
      })

      setPurchaseDialogOpen(false)
      resetPurchaseForm()
      fetchPurchases()
      calculateInventoryLevels() // Recalculate inventory after purchase
      fetchItemSuggestions() // Refresh suggestions
    } catch (error) {
      console.error("Error saving purchase:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add purchase",
        variant: "destructive",
      })
    }
  }

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      provisionItemName: "",
      quantity: "",
      unit: "",
      unitCost: "",
      total: 0
    }])
  }

  const updatePurchaseItem = (index: number, field: string, value: string) => {
    const updatedItems = [...purchaseItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === 'provisionItemName') {
      // Auto-fill unit and unit cost if item exists
      const existingItem = provisionItems.find(p => p.name.toLowerCase() === value.toLowerCase())
      if (existingItem) {
        updatedItems[index].unit = existingItem.unit
        updatedItems[index].unitCost = existingItem.unitCost.toString()
      } else {
        // For new items, set default values
        updatedItems[index].unit = 'kg' // Default unit
        updatedItems[index].unitCost = '' // Clear unit cost for manual entry
      }
    }

    if (field === 'quantity' || field === 'unitCost' || field === 'provisionItemName') {
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

  const handleRefresh = () => {
    window.location.reload()
  }

  const validateQuantity = (qty: string, unit: string, itemId: string) => {
    if (!qty || !itemId) {
      setQuantityError("")
      return
    }

    const item = provisionItems.find(p => p.id === itemId)
    if (!item) return

    const convertedQuantity = convertQuantity(parseFloat(qty), unit, item.unit)
    const availableInventory = inventoryLevels[itemId] || 0

    if (convertedQuantity > availableInventory && !editingUsage) {
      setQuantityError(`Cannot use ${convertedQuantity.toFixed(2)} ${item.unit}. Only ${availableInventory.toFixed(2)} ${item.unit} available.`)
    } else {
      setQuantityError("")
    }
  }

  const handleQuantityChange = (value: string) => {
    setQuantity(value)
    validateQuantity(value, quantityUnit, selectedItem)
  }

  const handleUnitChange = (value: string) => {
    setQuantityUnit(value)
    validateQuantity(quantity, value, selectedItem)
  }

  const handleItemChange = (value: string) => {
    setSelectedItem(value)
    const item = provisionItems.find(p => p.id === value)
    if (item) {
      setQuantityUnit(item.unit)
      validateQuantity(quantity, item.unit, value)
    }
  }

  const resetForm = () => {
    setEditingUsage(null)
    setSelectedItem("")
    setUsageType("day")
    setQuantity("")
    setQuantityUnit("")
    setQuantityError("")
    setDialogStartDate("")
    setDialogEndDate("")
  }

  const editUsage = (usage: ProvisionUsage) => {
    setEditingUsage(usage)
    setSelectedItem(usage.provisionItem.id)
    setQuantity(usage.quantity.toString())
    setQuantityUnit(usage.provisionItem.unit)
    setQuantityError("") // Clear any previous validation errors
    setDialogStartDate(usage.fromDate || usage.date)
    setDialogEndDate(usage.toDate || usage.date)
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
    fetchItemSuggestions()
  }, [])

  useEffect(() => {
    if (provisionItems.length > 0) {
      calculateInventoryLevels()
    }
  }, [provisionItems])

  useEffect(() => {
    fetchUsages()
    fetchPurchases()
  }, [startDate, endDate])

  // Get items with stock for usage
  const getItemsWithStock = () => {
    return provisionItems.filter(item => (inventoryLevels[item.id] || 0) > 0)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provision Management</h1>
          <p className="text-slate-600">Manage purchases, usage, and inventory of mess provisions</p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger
            value="inventory"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-50 transition-colors"
          >
            <Package className="w-5 h-5" />
            <span className="hidden sm:inline">Inventory</span>
            <span className="sm:hidden">Inventory</span>
          </TabsTrigger>
          <TabsTrigger
            value="purchase"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Purchase</span>
            <span className="sm:hidden">Purchase</span>
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="flex items-center gap-2 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-700 data-[state=inactive]:hover:bg-slate-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Usage</span>
            <span className="sm:hidden">Usage</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Current Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-slate-600">Loading inventory data...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Available Stock</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provisionItems
                      .filter((item) => (inventoryLevels[item.id] || 0) > 0)
                      .map((item) => {
                        const stock = inventoryLevels[item.id] || 0
                        const totalValue = stock * Number(item.unitCost)
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">₹{Number(item.unitCost).toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-medium ${stock < 0 ? 'text-red-600' : stock === 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {stock.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">₹{totalValue.toFixed(2)}</TableCell>
                          </TableRow>
                        )
                      })}
                    {provisionItems.filter((item) => (inventoryLevels[item.id] || 0) > 0).length === 0 && !inventoryLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No items with available stock
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="purchaseFilter">Provision Item</Label>
                  <Select value={purchaseFilter} onValueChange={setPurchaseFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {provisionItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      const existingItem = provisionItems.find(p => p.name.toLowerCase() === item.provisionItemName.toLowerCase())
                      const isNewItem = item.provisionItemName && !existingItem
                      const availableUnits = existingItem ? getAvailableUnits(existingItem.unit) : ['kg', 'gm', 'ltr', 'ml', 'unit']

                      return (
                        <div key={index} className="grid grid-cols-6 gap-2 p-2 border rounded">
                          <div className="relative col-span-2">
                            <Input
                              type="text"
                              placeholder="Enter item name"
                              value={item.provisionItemName}
                              onChange={(e) => {
                                updatePurchaseItem(index, 'provisionItemName', e.target.value)
                                setShowSuggestions(true)
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              className="w-full"
                            />
                            {showSuggestions && itemSuggestions.filter(s => s.toLowerCase().includes(item.provisionItemName.toLowerCase())).length > 0 && (
                              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-40 overflow-y-auto">
                                {itemSuggestions
                                  .filter(s => s.toLowerCase().includes(item.provisionItemName.toLowerCase()))
                                  .slice(0, 5)
                                  .map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => updatePurchaseItem(index, 'provisionItemName', suggestion)}
                                    >
                                      {suggestion}
                                    </div>
                                  ))}
                              </div>
                            )}
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
                              onChange={(e) => updatePurchaseItem(index, 'unitCost', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Total"
                              value={item.total.toFixed(2)}
                              readOnly
                              className="bg-gray-50 w-full"
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
                    purchases
                      .filter(purchase => {
                        if (purchaseFilter === "all") return true
                        return Array.isArray(purchase.items) && purchase.items.some(item => item.provisionItem?.id === purchaseFilter)
                      })
                      .map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                          <TableCell>{purchase.vendor}</TableCell>
                          <TableCell>
                            {Array.isArray(purchase.items) && purchase.items
                              .filter(item => purchaseFilter === "all" || item.provisionItem?.id === purchaseFilter)
                              .map((item, idx) => (
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
                        No purchases found for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="usageFilter">Provision Item</Label>
                  <Select value={usageFilter} onValueChange={setUsageFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {provisionItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      onValueChange={handleItemChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {getItemsWithStock().map(item => {
                          const availableInventory = inventoryLevels[item.id] || 0
                          return (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit}) - Available: {availableInventory.toFixed(2)} {item.unit}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {selectedItem && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <span className="font-medium">Available Inventory: </span>
                        <span className={inventoryLevels[selectedItem] < 0 ? 'text-red-600' : 'text-green-600'}>
                          {(inventoryLevels[selectedItem] || 0).toFixed(2)} {provisionItems.find(p => p.id === selectedItem)?.unit}
                        </span>
                      </div>
                    )}
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
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className={quantityError ? "border-red-500" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={quantityUnit} onValueChange={handleUnitChange}>
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
                  {quantityError && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                      {quantityError}
                    </div>
                  )}
                  {usageType === "day" && (
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={dialogStartDate}
                        onChange={(e) => setDialogStartDate(e.target.value)}
                      />
                    </div>
                  )}
                  {usageType === "week" && (
                    <div>
                      <Label htmlFor="weekStart">Week Starting</Label>
                      <Input
                        id="weekStart"
                        type="date"
                        value={dialogStartDate}
                        onChange={(e) => setDialogStartDate(e.target.value)}
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
                          value={dialogStartDate}
                          onChange={(e) => setDialogStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthEnd">End Date</Label>
                        <Input
                          id="monthEnd"
                          type="date"
                          value={dialogEndDate}
                          onChange={(e) => setDialogEndDate(e.target.value)}
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
                  {usages
                    .filter(usage => usageFilter === "all" || usage.provisionItem.id === usageFilter)
                    .map((usage) => {
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
                  {usages.filter(usage => usageFilter === "all" || usage.provisionItem.id === usageFilter).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No usage records found for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

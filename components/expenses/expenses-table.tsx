"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, ArrowUp } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { EditExpenseDialog } from "@/components/expenses/edit-expense-dialog"

interface Expense {
  id: string
  name: string
  type: string
  amount: number
  date: string
  description: string
  billId?: string
  bill?: {
    month: string
  }
}

interface ExpensesTableProps {
  year: string
  month: string
}

export function ExpensesTable({ year, month }: ExpensesTableProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/expenses?year=${year}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      } else {
        setExpenses([])
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [year, month])

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowScrollToTop(scrollY > 300)
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

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchExpenses()
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'LABOUR': return 'bg-blue-500/15 text-blue-700 border-0'
      case 'MAINTENANCE': return 'bg-amber-500/15 text-amber-700 border-0'
      case 'UTILITY': return 'bg-purple-500/15 text-purple-700 border-0'
      case 'OTHER': return 'bg-muted text-muted-foreground border-0'
      default: return 'bg-muted text-muted-foreground border-0'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Loading Expenses...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/40 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{expense.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{formatDate(expense.date)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(expense.type)}>
                      {expense.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-right font-medium">₹{Number(expense.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleEditClick(expense)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditExpenseDialog
        expense={selectedExpense}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ease-in-out transform hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
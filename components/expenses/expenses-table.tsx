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
      case 'LABOUR': return 'bg-blue-100 text-blue-800'
      case 'PROVISION': return 'bg-green-100 text-green-800'
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800'
      case 'UTILITY': return 'bg-purple-100 text-purple-800'
      case 'OTHER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Loading Expenses...</CardTitle>
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
                    <div className="font-medium text-slate-900">{expense.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{formatDate(expense.date)}</div>
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
                      className="p-1 hover:bg-slate-100 rounded"
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
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ease-in-out transform hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
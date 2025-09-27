"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog"

interface ExpensesActionsProps {
  onRefresh?: () => void
}

export function ExpensesActions({ onRefresh }: ExpensesActionsProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={() => setAddDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>

      <AddExpenseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => onRefresh?.()}
      />
    </div>
  )
}
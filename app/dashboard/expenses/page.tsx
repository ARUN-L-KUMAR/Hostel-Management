"use client"

import { useState } from "react"
import { DollarSign, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog"

export default function ExpensesPage() {
    const currentDate = new Date()
    const [year, setYear] = useState(currentDate.getFullYear().toString())
    const [month, setMonth] = useState((currentDate.getMonth() + 1).toString())
    const [addDialogOpen, setAddDialogOpen] = useState(false)

    const handleExpenseAdded = () => {
        // This will trigger a re-fetch in ExpensesTable if we force it, 
        // but for now relying on the page refresh or state lift logic.
        // Ideally, we should pass a refresh trigger to ExpensesTable.
        // For this implementation, we'll try to just close the dialog.
        // A full refresh might be needed or a context based refresh.
        window.location.reload() // Simple refresh for now to ensure data consistency
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Expenses</h1>
                    <p className="text-muted-foreground mt-1">Track and manage hostel operational expenses.</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="w-32">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-40">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">January</SelectItem>
                            <SelectItem value="2">February</SelectItem>
                            <SelectItem value="3">March</SelectItem>
                            <SelectItem value="4">April</SelectItem>
                            <SelectItem value="5">May</SelectItem>
                            <SelectItem value="6">June</SelectItem>
                            <SelectItem value="7">July</SelectItem>
                            <SelectItem value="8">August</SelectItem>
                            <SelectItem value="9">September</SelectItem>
                            <SelectItem value="10">October</SelectItem>
                            <SelectItem value="11">November</SelectItem>
                            <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Expenses Table */}
            <ExpensesTable year={year} month={month} />

            {/* Add Expense Dialog */}
            <AddExpenseDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={handleExpenseAdded}
            />
        </div>
    )
}

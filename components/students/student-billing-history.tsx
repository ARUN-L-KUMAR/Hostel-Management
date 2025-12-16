import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Download, Calendar, CreditCard } from "lucide-react"

interface StudentBillingHistoryProps {
  studentId: string
  bills: any[]
}

export function StudentBillingHistory({ studentId, bills = [] }: StudentBillingHistoryProps) {
  // Process real bills data
  // The structure from prisma studentBills include: { bill: { ... }, status, ... }
  // We map it to a flattened structure for display
  const billingHistory = bills.map(item => ({
    id: item.bill.id,
    month: `${new Date(item.bill.month).toLocaleString('default', { month: 'long' })} ${item.bill.year}`,
    amount: item.bill.amount,
    mandays: item.bill.mandays || 0,
    perDayRate: item.bill.perDayRate || 0,
    status: item.status.toLowerCase(),
    paidDate: item.paidDate,
    dueDate: item.dueDate || new Date(item.bill.year, item.bill.month, 10).toISOString(), // Assume 10th of next month if not set
  }))


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0">
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-0">
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/25 border-0">
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const totalPaid = billingHistory.filter((bill) => bill.status === "paid").reduce((sum, bill) => sum + bill.amount, 0)

  const totalOutstanding = billingHistory
    .filter((bill) => bill.status !== "paid")
    .reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <div className="space-y-6">
      {/* Billing Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 4 months</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{Math.round(totalPaid / 3).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on paid bills</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Monthly billing records and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.map((bill) => (
              <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bill.month}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {bill.mandays} mandays × ₹{bill.perDayRate}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Bill ID: {bill.id}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">₹{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Amount</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}</p>
                    {bill.paidDate && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-500">
                        Paid: {new Date(bill.paidDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(bill.status)}
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Overview of payment patterns and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">Payment Method</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Online Transfer</p>
              <p className="text-xs text-muted-foreground">Account: ****1234</p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                <h4 className="font-medium text-foreground">Payment History</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">3 of 4 bills paid</p>
              <p className="text-xs text-muted-foreground">75% payment rate</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <h4 className="font-medium text-amber-700 dark:text-amber-400">Outstanding Balance</h4>
            </div>
            <p className="text-sm text-amber-600/90 dark:text-amber-400/90 mb-4">
              You have ₹{totalOutstanding.toLocaleString()} in outstanding bills. Please clear your dues to avoid
              service interruption.
            </p>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
              Pay Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

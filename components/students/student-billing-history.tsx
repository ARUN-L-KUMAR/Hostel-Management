import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Download, Calendar, CreditCard } from "lucide-react"

interface StudentBillingHistoryProps {
  studentId: string
}

export function StudentBillingHistory({ studentId }: StudentBillingHistoryProps) {
  // Mock data - in real app, this would come from the database
  const billingHistory = [
    {
      id: "BILL-2024-01",
      month: "January 2024",
      amount: 4250,
      mandays: 28,
      perDayRate: 38.24,
      status: "paid",
      paidDate: "2024-02-05",
      dueDate: "2024-02-01",
    },
    {
      id: "BILL-2023-12",
      month: "December 2023",
      amount: 3800,
      mandays: 25,
      perDayRate: 36.5,
      status: "paid",
      paidDate: "2024-01-03",
      dueDate: "2024-01-01",
    },
    {
      id: "BILL-2023-11",
      month: "November 2023",
      amount: 4100,
      mandays: 27,
      perDayRate: 37.85,
      status: "paid",
      paidDate: "2023-12-02",
      dueDate: "2023-12-01",
    },
    {
      id: "BILL-2023-10",
      month: "October 2023",
      amount: 3950,
      mandays: 26,
      perDayRate: 38.12,
      status: "overdue",
      paidDate: null,
      dueDate: "2023-11-01",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 4 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(totalPaid / 3).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on paid bills</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Monthly billing records and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{bill.month}</p>
                    <p className="text-sm text-muted-foreground">
                      {bill.mandays} mandays × ₹{bill.perDayRate}
                    </p>
                    <p className="text-xs text-muted-foreground">Bill ID: {bill.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold">₹{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Amount</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}</p>
                    {bill.paidDate && (
                      <p className="text-xs text-green-600">
                        Paid: {new Date(bill.paidDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(bill.status)}
                    <Button variant="outline" size="sm">
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
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Overview of payment patterns and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Payment Method</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Online Transfer</p>
              <p className="text-xs text-muted-foreground">Account: ****1234</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Payment History</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">3 of 4 bills paid</p>
              <p className="text-xs text-muted-foreground">75% payment rate</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Outstanding Balance</h4>
            </div>
            <p className="text-sm text-yellow-700">
              You have ₹{totalOutstanding.toLocaleString()} in outstanding bills. Please clear your dues to avoid
              service interruption.
            </p>
            <Button className="mt-2" size="sm">
              Pay Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

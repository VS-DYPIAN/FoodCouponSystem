import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import { CreditCard, ReceiptText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type TransactionWithEmployee = Transaction & {
  employeeName: string;
};

export default function VendorDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: transactions } = useQuery<TransactionWithEmployee[]>({
    queryKey: ["/api/vendor/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // Total Earnings
  const totalEarnings = transactions
    ?.filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const todayEarnings = transactions
    ?.filter((t) => t.status === "completed" && isToday(new Date(t.timestamp)))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const downloadCSV = async () => {
    if (!transactions || transactions.length === 0) {
      alert("No transactions available to download.");
      return;
    }

    const startDateStr = dateRange.from ? dateRange.from.toISOString().split("T")[0] : "all";
    const endDateStr = dateRange.to ? dateRange.to.toISOString().split("T")[0] : "all";
    const fileName = `vendor_transactions_${startDateStr}_to_${endDateStr}.csv`;

    const params = new URLSearchParams({
      ...(dateRange.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange.to && { endDate: dateRange.to.toISOString() }),
    });

    const response = await fetch(`/api/vendor/transactions/csv?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Total Earnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">₹{totalEarnings?.toFixed(2) || "0.00"}</p>
            </CardContent>
          </Card>

          {/* Today's Earnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Today's Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">₹{todayEarnings?.toFixed(2) || "0.00"}</p>
            </CardContent>
          </Card>

          {/* Recent Transactions Count */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-6 w-6" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {transactions?.filter((t) => t.status === "completed").length || 0} transactions received
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="grid gap-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.from?.toISOString().split("T")[0] || ""}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          from: e.target.value ? new Date(e.target.value) : undefined,
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={dateRange.to?.toISOString().split("T")[0] || ""}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          to: e.target.value ? new Date(e.target.value) : undefined,
                        }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={downloadCSV}>Download CSV Report</Button>
              </div>
            </div>

            <div className="space-y-4">
              {transactions
                ?.slice()
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Descending order
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Amount: ₹{transaction.amount}</p>
                      <p className="text-sm text-muted-foreground">From: {transaction.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.timestamp), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              {(!transactions || transactions.length === 0) && (
                <p className="text-center text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

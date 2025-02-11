import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CreditCard, ReceiptText } from "lucide-react";

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

  const totalEarnings = transactions
    ?.filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

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

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                ${totalEarnings?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-6 w-6" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {transactions?.filter((t) => t.status === "completed").length || 0}{" "}
                transactions received
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
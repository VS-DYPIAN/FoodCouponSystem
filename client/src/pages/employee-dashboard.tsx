import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { WalletCards, ArrowDownIcon, ArrowUpIcon } from "lucide-react";

export default function EmployeeDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [amount, setAmount] = useState("");

  const { data: vendors } = useQuery<User[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/employee/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/employee/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const payVendorMutation = useMutation({
    mutationFn: async ({
      vendorId,
      amount,
    }: {
      vendorId: number;
      amount: number;
    }) => {
      const res = await apiRequest("POST", "/api/employee/pay", {
        vendorId,
        amount,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment completed successfully",
      });
      setAmount("");
      setSelectedVendorId("");
      queryClient.invalidateQueries({ queryKey: ["/api/employee/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
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
                <WalletCards className="h-6 w-6" />
                Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${user?.walletBalance}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Make Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedVendorId || !amount) return;
                  payVendorMutation.mutate({
                    vendorId: parseInt(selectedVendorId),
                    amount: parseFloat(amount),
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="vendor">Select Vendor</Label>
                  <Select
                    value={selectedVendorId}
                    onValueChange={setSelectedVendorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.username}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    payVendorMutation.isPending ||
                    !selectedVendorId ||
                    !amount ||
                    parseFloat(amount) <= 0
                  }
                >
                  {payVendorMutation.isPending ? "Processing..." : "Pay"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions (Last 30 Days)</CardTitle>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="high">High to Low</SelectItem>
                <SelectItem value="low">Low to High</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions?.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <WalletCards className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Payment to {transaction.vendorName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.timestamp), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">
                      -${parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <span className="text-sm text-green-600">Completed</span>
                  </div>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <p className="text-center text-muted-foreground">
                  No transactions yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

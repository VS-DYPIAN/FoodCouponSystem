import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Placeholder for date formatting (replace with actual implementation)
const format = (date: Date, formatString: string) => date.toLocaleString();

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: adminTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/transactions/csv");
      return response.json();
    }
  });

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  const downloadCSV = async () => {
    const startDateStr = dateRange.from ? dateRange.from.toISOString().split("T")[0] : "all";
    const endDateStr = dateRange.to ? dateRange.to.toISOString().split("T")[0] : "all";
    const fileName = `transactions_${startDateStr}_to_${endDateStr}.csv`;
  
    const params = new URLSearchParams({
      format: "csv",
      ...(dateRange.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange.to && { endDate: dateRange.to.toISOString() }),
    });
  
    const response = await fetch(`/api/admin/transactions/csv?${params}`);
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
  

  const updateWalletMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: string }) => {
      const res = await apiRequest("POST", "/api/admin/wallet", {
        userId,
        amount,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wallet balance updated successfully",
      });
      setAmount("");
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Employee List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {users?.filter((u) => u.role === "employee").map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{employee.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Balance: ${employee.walletBalance}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedUserId(employee.id)}>
                    Update Balance
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedUserId && (
            <Card>
              <CardHeader>
                <CardTitle>Update Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateWalletMutation.mutate({ userId: selectedUserId, amount });
                  }}
                  className="space-y-4"
                >
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
                  <Button type="submit" className="w-full" disabled={updateWalletMutation.isPending}>
                    {updateWalletMutation.isPending ? "Updating..." : "Update Balance"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Transaction Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="grid gap-2">
                    <Label>Date Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateRange.from?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                      />
                      <Input
                        type="date"
                        value={dateRange.to?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                      />
                    </div>
                  </div>
                  <Button onClick={downloadCSV}>Download CSV Report</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Amount Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminTransactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.timestamp), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {users?.find(u => u.id === transaction.employeeId)?.username || transaction.employeeId}
                        </TableCell>
                        <TableCell>${Number(transaction.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

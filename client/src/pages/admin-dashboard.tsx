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
import { FaFilePdf, FaFileCsv } from "react-icons/fa"; // Importing icons
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";


// Placeholder for date formatting (replace with actual implementation)
const format = (date: Date, formatString: string) => date.toLocaleString();

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");  // Add searchTerm state for filtering

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

  //
  const downloadPDF = () => {
    if (!adminTransactions || adminTransactions.length === 0) {
      alert("No transactions available to download.");
      return;
    }
  
    // Filter transactions based on date range
    const filteredTransactions = adminTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.timestamp);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;
  
      return (!fromDate || transactionDate >= fromDate) && (!toDate || transactionDate <= toDate);
    });
  
    if (filteredTransactions.length === 0) {
      alert("No transactions found for the selected date range.");
      return;
    }
  
    const doc = new jsPDF();
    doc.text("Transactions Report", 14, 10);
  
    // Display selected date range
    const startDateStr = dateRange.from ? dateRange.from.toLocaleDateString() : "All";
    const endDateStr = dateRange.to ? dateRange.to.toLocaleDateString() : "All";
    doc.text(`Date Range: ${startDateStr} - ${endDateStr}`, 14, 20);
  
    const tableColumn = ["Transaction ID", "Amount", "Status", "Date"];
    const tableRows: any[] = [];
  
    filteredTransactions.forEach((transaction) => {
      const transactionData = [
        transaction.transactionId,
        `${Number(transaction.amount).toFixed(2)}`,
        transaction.status,
        new Date(transaction.timestamp).toLocaleString(),
      ];
      tableRows.push(transactionData);
    });
  
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
  
    const fileName = `transactions_${startDateStr}_to_${endDateStr}.pdf`;
    doc.save(fileName);
  };
    


  const downloadCSV = async () => {
    const params = new URLSearchParams({
      format: 'csv',
      ...(dateRange.from && { startDate: dateRange.from.toISOString() }),
      ...(dateRange.to && { endDate: dateRange.to.toISOString() })
    });

    const response = await fetch(`/api/admin/transactions/csv?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
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
  const updateAllWalletsMutation = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      const res = await apiRequest("POST", "/api/admin/wallet/update-all", { amount });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wallet balance updated for all employees",
      });
      setAmount(""); // Clear the input after success
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
        <div className="flex justify-between items-center mb-4 p-4 bg-muted rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold">Employee Wallet Management</h2>
  
  <div className="flex items-center gap-4">
    {/* Input for Amount */}
    <Input
      type="number"
      step="0.01"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      placeholder="Enter amount"
      className="w-32"
    />
    
    {/* Update Balances Button */}
    <Button 
      variant="destructive" 
      onClick={() => updateAllWalletsMutation.mutate({ amount })}
      disabled={updateAllWalletsMutation.isPending || !amount}
      className="w-full md:w-auto"
    >
      {updateAllWalletsMutation.isPending ? "Updating..." : "Update Balances"}
    </Button>
  </div>
</div>



        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Employee List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Label htmlFor="employeeSearch">Search Employee</Label>
                <Input
                  id="employeeSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter employee name"
                />
              </div>
              {users?.filter((u) => u.role === "employee" && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{employee.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ₹{employee.walletBalance}
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
  <div className="flex flex-wrap gap-4 items-center justify-center md:justify-between">
    <div className="grid gap-2 w-full md:w-auto">
      <Label>Date Range</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          type="date"
          value={dateRange.from?.toISOString().split('T')[0] || ''}
          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
          className="w-full md:w-auto"
        />
        <Input
          type="date"
          value={dateRange.to?.toISOString().split('T')[0] || ''}
          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
          className="w-full md:w-auto"
        />
      </div>
    </div>
    
    {/* Download Buttons */}
<div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
  <Button onClick={downloadCSV} className="w-full md:w-auto flex items-center gap-2">
    <FaFileCsv className="text-green-600" /> Download CSV
  </Button>
  <Button onClick={downloadPDF} className="w-full md:w-auto flex items-center gap-2">
    <FaFilePdf className="text-red-600" /> Download PDF
  </Button>
</div>
  </div>

  {/* Responsive Table */}
  <div className="overflow-x-auto">
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adminTransactions?.length ? (
          adminTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.timestamp), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {users ? users.find(u => u.id === transaction.employeeId)?.username ?? "Unknown" : "Loading..."}
              </TableCell>
              <TableCell>₹{!isNaN(Number(transaction.amount)) ? Number(transaction.amount).toFixed(2) : "N/A"}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="text-center">
              No transactions found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { createServer, type Server } from "http";
import type { Express } from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { users, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendNotification } from "./websocket";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Admin routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  });

  app.post("/api/admin/wallet", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.sendStatus(403);
    }

    const { userId, amount } = req.body;
    try {
      const user = await storage.updateUserWallet(userId, parseFloat(amount));

      // Send notification to user about wallet update
      sendNotification({
        type: "wallet_update",
        message: `Your wallet has been updated by ${amount}`,
        timestamp: new Date().toISOString(),
        recipientId: userId,
      });

      res.json(user);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Employee routes
  app.get("/api/vendors", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(403);
    }
    const vendors = await db.select().from(users).where(eq(users.role, "vendor"));
    res.json(vendors);
  });

  app.post("/api/employee/pay", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "employee") {
      return res.sendStatus(403);
    }

    const { vendorId, amount } = req.body;
    try {
      await storage.updateUserWallet(req.user.id, -amount);
      const transaction = await storage.createTransaction({
        employeeId: req.user.id,
        vendorId,
        amount: amount.toString(),
        timestamp: new Date(),
        status: "completed",
      });

      // Send notifications to both employee and vendor
      sendNotification({
        type: "transaction",
        message: `Payment of $${amount} sent to vendor`,
        timestamp: transaction.timestamp.toISOString(),
        recipientId: req.user.id,
      });

      sendNotification({
        type: "transaction",
        message: `Received payment of $${amount} from ${req.user.username}`,
        timestamp: transaction.timestamp.toISOString(),
        recipientId: vendorId,
      });

      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/employee/transactions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "employee") {
      return res.sendStatus(403);
    }
    const transactions = await storage.getTransactionsByEmployee(req.user.id);
    res.json(transactions);
  });

  // Get vendor transactions CSV
  app.get("/api/vendor/transactions/csv", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "vendor") {
      return res.sendStatus(403);
    }
  
    try {
      const { startDate, endDate } = req.query;
      let transactions = await storage.getTransactions(req.user.id);
      const users = await storage.getAllUsers();
  
      // Filter transactions by date range
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        transactions = transactions.filter((t) => {
          const date = new Date(t.timestamp);
          return date >= start && date <= end;
        });
      }
  
      // Construct dynamic filename
      const startDateStr = startDate ? startDate.toString().split("T")[0] : "all";
      const endDateStr = endDate ? endDate.toString().split("T")[0] : "all";
      const fileName = `vendor_transactions_${startDateStr}_to_${endDateStr}.csv`;
  
      // Set headers for CSV response
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  
      // CSV header
      res.write("Transaction ID, Date, Employee, Amount, Status\n");
  
      // Stream transaction data
      transactions.forEach((t) => {
        const employee = users.find((u) => u.id === t.employeeId)?.username || "Unknown";
        res.write(`${t.id},${new Date(t.timestamp).toISOString()},${employee},${t.amount},${t.status}\n`);
      });
  
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message: "Error generating CSV report", error: errorMessage });
    }
  });
  
  

// Get admin transactions report
// Get admin transactions report
app.get("/api/admin/transactions/csv", async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  const { startDate, endDate, format } = req.query;

  try {
    const transactions = await storage.getAdminTransactions();
    const users = await storage.getAllUsers();

    let filteredTransactions = transactions;

    // Filter transactions by date range
    let fileStartDate = "all";
    let fileEndDate = "dates";

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // Make sure endDate is inclusive of the whole day

      filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.timestamp);
        return date >= start && date <= end;
      });

      // Format dates for filename (YYYY-MM-DD)
      fileStartDate = start.toISOString().split("T")[0];
      fileEndDate = end.toISOString().split("T")[0];
    }

    // Handle CSV format
    if (format === 'csv') {
      const fileName = `BalanceReport_${fileStartDate}_to_${fileEndDate}.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      // Write CSV header
      res.write("Date,Employee,Amount\n");

      // Write CSV data
      filteredTransactions.forEach((t) => {
        const employee = users.find((u) => u.id === t.employeeId)?.username || t.employeeId;
        res.write(`${new Date(t.timestamp).toISOString()},${employee},${t.amount}\n`);
      });

      res.end();
    } else {
      // If not CSV, return JSON response
      res.json(filteredTransactions);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: "Error generating CSV report", error: errorMessage });
  }
});


  // Vendor routes
  app.get("/api/vendor/transactions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "vendor") {
      return res.sendStatus(403);
    }
    const vendorTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        timestamp: transactions.timestamp,
        status: transactions.status,
        employeeId: transactions.employeeId,
        employeeName: users.username,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.employeeId, users.id))
      .where(eq(transactions.vendorId, req.user.id));

    res.json(vendorTransactions);
  });

  const httpServer = createServer(app);
  return httpServer;
}

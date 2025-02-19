import { createServer, type Server } from "http";
import type { Express } from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { users, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendNotification } from "./websocket";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
//import { Workbook, Cell, Row, Column, Worksheet } from "exceljs";
import ExcelJS from "exceljs";
const workbook = new ExcelJS.Workbook();



export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/vendor/transactions/excel", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "vendor") {
      return res.sendStatus(403);
    }
  
    try {
      const { startDate, endDate } = req.query;
      let transactions = await storage.getTransactions(req.user.id);
  
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        transactions = transactions.filter((t) => {
          const date = new Date(t.timestamp);
          return date >= start && date <= end;
        });
      }
  
      // Initialize a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Vendor Transactions");
  
      // Define headers
      const headers = ["Transaction ID", "Amount (₹)", "Status", "Date & Time"];
      
      // Add headers to worksheet
      worksheet.addRow(headers);
  
      // Apply header styling (Bold, Blue background, White text, Centered)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNum) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F81BD" } }; // Blue background
        cell.font = { bold: true, color: { argb: "FFFFFF" } }; // White text
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
  
      // Populate data rows
      transactions.forEach((t) => {
        const row = worksheet.addRow([
          t.transactionId,
          
          `₹${parseFloat(t.amount).toFixed(2)}`,
          t.status,
          new Date(t.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        ]);
  
        // Apply border to each cell in the row
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });
  
      // Adjust column widths
      worksheet.columns = [
        { width: 35 }, // Transaction ID
        { width: 15 }, // Amount
        { width: 15 }, // Status
        { width: 40 }, // Date & Time
      ];
  
      // Convert workbook to buffer and send response
      const fileName = `vendor_transactions_${startDate || "all"}_to_${endDate || "all"}.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  
      const buffer = await workbook.xlsx.writeBuffer();
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Error generating Excel report", error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });
  

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
 // ✅ Fixed: Admin bulk wallet update ensures `walletBalance` is stored as a number
 app.post("/api/admin/wallet/update-all", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: "Invalid amount provided." });
  }

  try {
    await db.update(users).set({ walletBalance: amount }).where(eq(users.role, "employee"));

    res.json({ success: true, message: `Wallet balance updated for all employees to ${amount}.` });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
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

      sendNotification({
        type: "transaction",
        message: `Payment of $${amount} sent to vendor`,
        timestamp: transaction.timestamp.toISOString(),
        recipientId: req.user.id,
      });

      sendNotification({
        type: "transaction",
        message: `Received payment of $${amount}. Transaction ID: ${transaction.id}`,
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

  //
  app.get("/api/vendor/transactions/pdf", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "vendor") {
      return res.sendStatus(403);
    }
  
    try {
      const transactions = await storage.getAdminTransactions();
  
      const doc = new jsPDF();
      doc.text("Admin Transactions Report", 14, 10);
  
      // Define table headers
      const headers = [["Transaction ID", "Date", "Amount", "Status"]];
      const data = transactions.map((t) => [
        t.transactionId,
        new Date(t.timestamp).toLocaleString(),
        `$${t.amount}`,
        t.status,
      ]);
  
      // Add table to PDF
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 20,
      });
  
      const fileName = `Admin_Transactions_${new Date().toISOString().split("T")[0]}.pdf`;
  
      // Send the file as a response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      const pdfOutput = doc.output("arraybuffer");
  
      res.send(Buffer.from(pdfOutput));
    } catch (error) {
      res.status(500).json({ message: "Error generating PDF", error: (error as Error).message });
    }
  });

 
  
  
  // Get vendor transactions CSV
  app.get("/api/vendor/transactions/csv", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "vendor") {
      return res.sendStatus(403);
    }

    try {
      const { startDate, endDate } = req.query;
      let transactions = await storage.getTransactions(req.user.id);

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        transactions = transactions.filter((t) => {
          const date = new Date(t.timestamp);
          return date >= start && date <= end;
        });
      }

      const fileName = `vendor_transactions_${startDate || "all"}_to_${endDate || "all"}.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      res.write("Transaction ID, Date, Amount, Status\n");

      transactions.forEach((t) => {
        res.write(`${t.transactionId},${new Date(t.timestamp).toISOString()},${t.amount},${t.status}\n`);
      });

      res.end();
    } catch (error) {
      res.status(500).json({ message: "Error generating CSV report", error: error instanceof Error ? error.message : "Unknown error occurred" });
    }
  });

  // Get admin transactions CSV
  app.get("/api/admin/transactions/csv", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.sendStatus(403);
    }

    const { startDate, endDate, format } = req.query;

    try {
      const transactions = await storage.getAdminTransactions();

      let filteredTransactions = transactions;
      let fileStartDate = "all";
      let fileEndDate = "dates";

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        filteredTransactions = transactions.filter((t) => {
          const date = new Date(t.timestamp);
          return date >= start && date <= end;
        });

        fileStartDate = start.toISOString().split("T")[0];
        fileEndDate = end.toISOString().split("T")[0];
      }

      if (format === 'csv') {
        const fileName = `BalanceReport_${fileStartDate}_to_${fileEndDate}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

        res.write("Transaction ID, Date, Amount\n");

        filteredTransactions.forEach((t) => {
          res.write(`${t.transactionId},${new Date(t.timestamp).toISOString()},${t.amount}\n`);
        });

        res.end();
      } else {
        res.json(filteredTransactions);
      }
    } catch (error) {
      res.status(500).json({ message: "Error generating CSV report", error: error instanceof Error ? error.message : "Unknown error occurred" });
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
        transactionId: transactions.transactionId
      })
      .from(transactions)
      .where(eq(transactions.vendorId, req.user.id));

    res.json(vendorTransactions);
  });

  const httpServer = createServer(app);
  return httpServer;
}

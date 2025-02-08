import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { users, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";

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
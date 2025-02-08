import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Admin routes
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
    const transactions = await storage.getTransactionsByVendor(req.user.id);
    res.json(transactions);
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "employee", "vendor"] }).notNull(),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertTransactionSchema = createInsertSchema(transactions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

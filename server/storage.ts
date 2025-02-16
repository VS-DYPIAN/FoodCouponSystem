import { InsertUser, User, Transaction, users, transactions } from "@shared/schema";
import { db } from "./db"; // Ensure this is correctly imported
import { eq, desc, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pool from "./db"; // Ensure we import `pool` correctly
import { nanoid } from "nanoid"; // Install nanoid: npm install nanoid

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: number, amount: number): Promise<User>;
  getTransactionsByEmployee(employeeId: number): Promise<Transaction[]>;
  getTransactionsByVendor(vendorId: number): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, "id" | "transactionId">): Promise<Transaction>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Get all transactions (for employee or vendor)
  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        or(eq(transactions.employeeId, userId), eq(transactions.vendorId, userId))
      )
      .orderBy(desc(transactions.timestamp));
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAdminTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp));
  }

  // Get a user by ID
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Get a user by username
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Create a new user
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Update the user's wallet balance
  async updateUserWallet(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newBalance = parseFloat(user.walletBalance) + amount;
    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    const [updatedUser] = await db
      .update(users)
      .set({ walletBalance: newBalance.toString() })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Get transactions by employee
  async getTransactionsByEmployee(employeeId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.employeeId, employeeId))
      .orderBy(desc(transactions.timestamp));
  }

  // Get transactions by vendor
  async getTransactionsByVendor(vendorId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.vendorId, vendorId))
      .orderBy(desc(transactions.timestamp));
  }

  // Create a new transaction
  async createTransaction(transaction: Omit<Transaction, "id" | "transactionId">): Promise<Transaction> {
    const transactionId = `TXN${Date.now()}${nanoid(6)}`; // Generate a unique transaction ID

    const [newTransaction] = await db
      .insert(transactions)
      .values({ ...transaction, transactionId, timestamp: new Date() }) // Store unique transaction ID
      .returning();
    
    return newTransaction;
  }
}

export const storage = new DatabaseStorage();

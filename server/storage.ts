import { InsertUser, User, Transaction, users, transactions } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: number, amount: number): Promise<User>;
  updateUserResetToken(userId: number, token: string, expires: Date): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  clearUserResetToken(userId: number): Promise<void>;
  getTransactionsByEmployee(employeeId: number): Promise<Transaction[]>;
  getTransactionsByVendor(vendorId: number): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
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

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          gt(users.resetPasswordExpires, new Date())
        )
      );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

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

  async updateUserResetToken(
    userId: number,
    token: string,
    expires: Date
  ): Promise<void> {
    await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async clearUserResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.id, userId));
  }

  async getTransactionsByEmployee(employeeId: number): Promise<Transaction[]> {
    return db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        timestamp: transactions.timestamp,
        status: transactions.status,
        employeeId: transactions.employeeId,
        vendorId: transactions.vendorId,
        vendorName: users.username
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.vendorId, users.id))
      .where(
        and(
          eq(transactions.employeeId, employeeId),
          eq(transactions.status, "completed")
        )
      )
      .orderBy(transactions.timestamp, "desc");
  }

  async getTransactionsByVendor(vendorId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.vendorId, vendorId));
  }

  async createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }
}

export const storage = new DatabaseStorage();
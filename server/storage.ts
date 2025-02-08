import { InsertUser, User, Transaction } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: number, amount: number): Promise<User>;
  getTransactionsByEmployee(employeeId: number): Promise<Transaction[]>;
  getTransactionsByVendor(vendorId: number): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private currentUserId: number;
  private currentTransactionId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, walletBalance: "0" };
    this.users.set(id, user);
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
    const updatedUser = { ...user, walletBalance: newBalance.toString() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getTransactionsByEmployee(employeeId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (t) => t.employeeId === employeeId,
    );
  }

  async getTransactionsByVendor(vendorId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (t) => t.vendorId === vendorId,
    );
  }

  async createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
}

export const storage = new MemStorage();

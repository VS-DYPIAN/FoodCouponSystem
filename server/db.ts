import dotenv from "dotenv";
dotenv.config();

import pkg from "pg"; // Import the entire pg package
const { Pool } = pkg; // Extract Pool from the default export

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Use environment variables for security
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  port: Number(process.env.DB_PORT) || 5432,
  password: process.env.DB_PASSWORD || "Gamechanger@14",
  database: process.env.DB_NAME || "FoodCoupon",
});

pool
  .connect()
  .then((client) => {
    console.log("Connected to PostgreSQL");
    client.release(); // Release the client back to the pool
  })
  .catch((err) => console.error("Connection error", err.stack));

export const db = drizzle(pool, { schema });

export default pool;

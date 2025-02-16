import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  user:"vaibhavsawant",
  password: "Gamechanger@14", // Ensure correct password
  server:"al-techies.database.windows.net",
  port: 1433, // Default MSSQL port
  database: "foodcoupon",
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: true, // Set to true if facing SSL issues
  },
};

// Create a connection pool
const pool = new sql.ConnectionPool(dbConfig);

async function initializeDB() {
  try {
    await pool.connect();
    console.log("✅ Connected to Azure SQL Database.");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

initializeDB();

export default pool;

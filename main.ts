import { Client } from 'pg';

const con = new Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "Gamechanger@14",
  database: "FoodCoupon"
});

con.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err.stack));

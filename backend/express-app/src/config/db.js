const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const pool = mysql.createPool({
  host: requiredEnv("DB_HOST"),
  port: Number(requiredEnv("DB_PORT")),
  user: requiredEnv("DB_USER"),
  password: process.env.DB_PASSWORD ?? "",
  database: requiredEnv("DB_NAME"),
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;

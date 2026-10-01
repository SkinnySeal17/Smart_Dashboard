const pool = require("./db");

async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS db");
    console.log(`Connected to database: ${rows[0].db}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();

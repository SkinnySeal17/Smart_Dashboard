const pool = require("../config/db");

// Reads the owner's services and categories for the dashboard calculations.
// Read-only: the services/categories tables belong to the services module,
// this only selects the columns the stats need and maps them to the
// camelCase shape used by dashboardStats.js and the frontend.

function toService(row) {
  return {
    id: String(row.id),
    name: row.name,
    category: String(row.category_id),
    // mysql2 returns DECIMAL as a string.
    cost: Number(row.cost),
    billingCycle: row.billing_cycle,
    renewalDate: row.renewal_date,
    status: row.status,
  };
}

function toCategory(row) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color,
  };
}

async function getDashboardData(userId) {
  const [serviceRows] = await pool.execute(
    `SELECT
       id,
       category_id,
       name,
       cost,
       billing_cycle,
       DATE_FORMAT(renewal_date, '%Y-%m-%d') AS renewal_date,
       status
     FROM services
     WHERE user_id = ?`,
    [userId]
  );

  const [categoryRows] = await pool.execute(
    `SELECT id, name, color
     FROM categories
     WHERE user_id = ?`,
    [userId]
  );

  return {
    services: serviceRows.map(toService),
    categories: categoryRows.map(toCategory),
  };
}

module.exports = {
  getDashboardData,
};

const pool = require("../config/db");

async function createService(userId, data) {
  const [result] = await pool.execute(
    `INSERT INTO services
      (user_id, category_id, name, cost, billing_cycle,
       renewal_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.category_id,
      data.name,
      data.cost,
      data.billing_cycle,
      data.renewal_date,
      data.status,
      data.notes,
    ]
  );

  return getServiceById(userId, result.insertId);
}

async function getServices(userId, filters = {}) {
  const conditions = ["s.user_id = ?"];
  const params = [userId];
  if (filters.search) {
    const pattern = `%${filters.search.replace(/[!%_]/g, "!$&")}%`;
    conditions.push("(s.name LIKE ? ESCAPE '!' OR s.notes LIKE ? ESCAPE '!')");
    params.push(pattern, pattern);
  }
  for (const key of ["status", "category_id", "billing_cycle"]) {
    if (filters[key] !== undefined) {
      conditions.push(`s.${key} = ?`);
      params.push(filters[key]);
    }
  }
  const [rows] = await pool.execute(
    `SELECT
       s.id,
       s.category_id,
       s.name,
       s.cost,
       s.billing_cycle,
       DATE_FORMAT(s.renewal_date, '%Y-%m-%d') AS renewal_date,
       s.status,
       s.notes,
       c.name AS category_name,
       c.color AS category_color,
       s.created_at,
       s.updated_at
     FROM services s
     JOIN categories c
       ON c.id = s.category_id
       AND c.user_id = s.user_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY s.renewal_date ASC, s.id ASC`,
    params
  );

  return rows;
}

async function getServiceById(userId, serviceId) {
  const [rows] = await pool.execute(
    `SELECT
       s.id,
       s.category_id,
       s.name,
       s.cost,
       s.billing_cycle,
       DATE_FORMAT(s.renewal_date, '%Y-%m-%d') AS renewal_date,
       s.status,
       s.notes,
       c.name AS category_name,
       c.color AS category_color,
       s.created_at,
       s.updated_at
     FROM services s
     JOIN categories c
       ON c.id = s.category_id
       AND c.user_id = s.user_id
     WHERE s.id = ? AND s.user_id = ?`,
    [serviceId, userId]
  );

  return rows[0] || null;
}

async function categoryBelongsToUser(userId, categoryId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM categories
     WHERE id = ? AND user_id = ?`,
    [categoryId, userId]
  );

  return rows.length > 0;
}

async function updateService(userId, serviceId, data) {
  const [result] = await pool.execute(
    `UPDATE services
     SET category_id = ?,
         name = ?,
         cost = ?,
         billing_cycle = ?,
         renewal_date = ?,
         status = ?,
         notes = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.category_id,
      data.name,
      data.cost,
      data.billing_cycle,
      data.renewal_date,
      data.status,
      data.notes,
      serviceId,
      userId,
    ]
  );

  if (result.affectedRows === 0) return null;

  return getServiceById(userId, serviceId);
}

async function deleteService(userId, serviceId) {
  const [result] = await pool.execute(
    `DELETE FROM services
     WHERE id = ? AND user_id = ?`,
    [serviceId, userId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createService,
  getServices,
  getServiceById,
  categoryBelongsToUser,
  updateService,
  deleteService,
};

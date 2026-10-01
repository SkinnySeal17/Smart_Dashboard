const pool = require("../config/db");

async function createCategory(userId, name, color) {
  const [result] = await pool.execute(
    `INSERT INTO categories (user_id, name, color)
     VALUES (?, ?, ?)`,
    [userId, name, color]
  );

  return getCategoryById(userId, result.insertId);
}

async function getCategories(userId) {
  const [rows] = await pool.execute(
    `SELECT id, name, color, created_at, updated_at
     FROM categories
     WHERE user_id = ?
     ORDER BY name ASC`,
    [userId]
  );

  return rows;
}

async function getCategoryById(userId, categoryId) {
  const [rows] = await pool.execute(
    `SELECT id, name, color, created_at, updated_at
     FROM categories
     WHERE id = ? AND user_id = ?`,
    [categoryId, userId]
  );

  return rows[0] || null;
}

async function updateCategory(userId, categoryId, name, color) {
  const [result] = await pool.execute(
    `UPDATE categories
     SET name = ?, color = ?
     WHERE id = ? AND user_id = ?`,
    [name, color, categoryId, userId]
  );

  if (result.affectedRows === 0) return null;

  return getCategoryById(userId, categoryId);
}

async function deleteCategory(userId, categoryId) {
  const [result] = await pool.execute(
    `DELETE FROM categories
     WHERE id = ? AND user_id = ?`,
    [categoryId, userId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};

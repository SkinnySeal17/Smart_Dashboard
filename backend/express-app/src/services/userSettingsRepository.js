const pool = require("../config/db");

const DEFAULT_SETTINGS = {
  notifications: true,
  theme: "light",
  currency: "AUD",
  defaultStatus: "active",
  dateFormat: "DD/MM/YYYY",
};

async function runQuery(db, sql, params) {
  try {
    return await db.query(sql, params);
  } catch (_error) {
    const safeError = new Error("Database request failed.");
    safeError.code = "DB_ERROR";
    throw safeError;
  }
}

async function findSettingsByUserId(userId, db = pool) {
  const [rows] = await runQuery(
    db,
    `SELECT id, user_id, notifications, theme, currency, default_status, date_format,
            created_at, updated_at
     FROM user_settings
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function createDefaultSettings(userId, db = pool) {
  await runQuery(
    db,
    `INSERT INTO user_settings
       (user_id, notifications, theme, currency, default_status, date_format)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      DEFAULT_SETTINGS.notifications,
      DEFAULT_SETTINGS.theme,
      DEFAULT_SETTINGS.currency,
      DEFAULT_SETTINGS.defaultStatus,
      DEFAULT_SETTINGS.dateFormat,
    ],
  );

  return findSettingsByUserId(userId, db);
}

module.exports = {
  DEFAULT_SETTINGS,
  findSettingsByUserId,
  createDefaultSettings,
};

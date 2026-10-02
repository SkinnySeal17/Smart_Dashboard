const pool = require("../config/db");

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  renewalReminders: true,
  renewalLeadDays: 7,
  overdueAlerts: true,
  weeklySummary: true,
  theme: "light",
  currency: "AUD",
  defaultStatus: "active",
  dateFormat: "DD/MM/YYYY",
};

const SETTINGS_COLUMNS = `id, user_id, email_notifications, renewal_reminders,
  renewal_lead_days, overdue_alerts, weekly_summary, theme, currency,
  default_status, date_format, created_at, updated_at`;

async function runQuery(db, sql, params) {
  try {
    return await db.query(sql, params);
  } catch (_error) {
    const safeError = new Error("Database request failed.");
    safeError.code = "DB_ERROR";
    throw safeError;
  }
}

function assertUserId(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Database request failed.");
    error.code = "DB_ERROR";
    throw error;
  }
  return id;
}

async function findSettingsByUserId(userId, db = pool) {
  const id = assertUserId(userId);
  const [rows] = await runQuery(
    db,
    `SELECT ${SETTINGS_COLUMNS}
     FROM user_settings
     WHERE user_id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function createDefaultSettings(userId, db = pool) {
  const id = assertUserId(userId);
  await runQuery(
    db,
    `INSERT INTO user_settings
       (user_id, email_notifications, renewal_reminders, renewal_lead_days,
        overdue_alerts, weekly_summary, theme, currency, default_status, date_format)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      DEFAULT_SETTINGS.emailNotifications,
      DEFAULT_SETTINGS.renewalReminders,
      DEFAULT_SETTINGS.renewalLeadDays,
      DEFAULT_SETTINGS.overdueAlerts,
      DEFAULT_SETTINGS.weeklySummary,
      DEFAULT_SETTINGS.theme,
      DEFAULT_SETTINGS.currency,
      DEFAULT_SETTINGS.defaultStatus,
      DEFAULT_SETTINGS.dateFormat,
    ],
  );

  return findSettingsByUserId(userId, db);
}

const THEMES = ["light", "dark", "system"];
const STATUSES = ["active", "inactive"];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const CURRENCY_RE = /^[A-Za-z0-9$€£¥.]{1,10}$/;
const SETTING_FIELDS = [
  ["email_notifications", "emailNotifications"],
  ["renewal_reminders", "renewalReminders"],
  ["renewal_lead_days", "renewalLeadDays"],
  ["overdue_alerts", "overdueAlerts"],
  ["weekly_summary", "weeklySummary"],
  ["theme", "theme"],
  ["currency", "currency"],
  ["default_status", "defaultStatus"],
  ["date_format", "dateFormat"],
];

function readBody(input) {
  return input && typeof input === "object" && !Array.isArray(input) ? input : {};
}

function parseSettingsUpdate(input) {
  const body = readBody(input);
  const errors = {};
  const values = {};
  let seen = 0;

  for (const [column, key] of SETTING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, column)) continue;
    seen += 1;
    const value = body[column];

    if (
      column === "email_notifications" ||
      column === "renewal_reminders" ||
      column === "overdue_alerts" ||
      column === "weekly_summary"
    ) {
      if (typeof value !== "boolean") errors[column] = "Must be true or false.";
      else values[key] = value;
    } else if (column === "renewal_lead_days") {
      if (!Number.isInteger(value) || value < 1 || value > 365) {
        errors[column] = "Must be a whole number from 1 to 365.";
      } else values[key] = value;
    } else if (column === "theme") {
      if (typeof value !== "string" || !THEMES.includes(value)) {
        errors[column] = "Theme must be light, dark, or system.";
      } else values[key] = value;
    } else if (column === "currency") {
      const currency = typeof value === "string" ? value.trim() : "";
      if (!CURRENCY_RE.test(currency)) {
        errors[column] = "Currency must be 1 to 10 letters, numbers, or a currency symbol.";
      } else values[key] = currency;
    } else if (column === "default_status") {
      if (typeof value !== "string" || !STATUSES.includes(value)) {
        errors[column] = "Default status must be active or inactive.";
      } else values[key] = value;
    } else if (column === "date_format") {
      const format = typeof value === "string" ? value.trim() : "";
      if (!DATE_FORMATS.includes(format)) {
        errors[column] = "Date format must be DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD.";
      } else values[key] = format;
    }
  }

  if (seen === 0) {
    errors.settings = "At least one settings field is required.";
  }

  return { errors, values };
}

async function updateSettings(userId, input, db = pool) {
  const id = assertUserId(userId);
  const { errors, values } = parseSettingsUpdate(input);
  if (Object.keys(errors).length > 0) {
    const error = new Error("Invalid settings.");
    error.code = "VALIDATION_ERROR";
    error.errors = errors;
    throw error;
  }

  const existing = await findSettingsByUserId(id, db);
  if (!existing) return null;

  const assignments = [];
  const params = [];
  for (const [column, key] of SETTING_FIELDS) {
    if (values[key] === undefined) continue;
    if (!/^[a-z_]+$/.test(column)) {
      const error = new Error("Database request failed.");
      error.code = "DB_ERROR";
      throw error;
    }
    assignments.push(`${column} = ?`);
    params.push(values[key]);
  }

  params.push(id);
  await runQuery(
    db,
    `UPDATE user_settings SET ${assignments.join(", ")} WHERE user_id = ?`,
    params,
  );
  return findSettingsByUserId(userId, db);
}

function toPublicSettings(row) {
  if (!row) return null;
  const on = (value) => value === true || value === 1;
  return {
    id: row.id,
    user_id: row.user_id,
    email_notifications: on(row.email_notifications),
    renewal_reminders: on(row.renewal_reminders),
    renewal_lead_days: Number(row.renewal_lead_days),
    overdue_alerts: on(row.overdue_alerts),
    weekly_summary: on(row.weekly_summary),
    theme: row.theme,
    currency: row.currency,
    default_status: row.default_status,
    date_format: row.date_format,
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  findSettingsByUserId,
  createDefaultSettings,
  updateSettings,
  toPublicSettings,
};

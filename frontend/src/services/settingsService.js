import { api } from "./api";

export const THEMES = ["light", "dark", "system"];
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
export const DEFAULT_STATUSES = ["active", "inactive"];
export const RENEWAL_LEAD_DAYS = [1, 3, 7, 14];

export const DEFAULTS = {
  notifications: {
    email: true,
    renewalReminders: true,
    renewalLeadDays: 7,
    overdueAlerts: true,
    weeklySummary: true,
  },
  appearance: {
    theme: "light",
  },
  preferences: {
    currency: "AUD",
    defaultStatus: "active",
    dateFormat: "DD/MM/YYYY",
  },
};

export function fromApiSettings(row) {
  return {
    notifications: {
      email: Boolean(row.email_notifications),
      renewalReminders: Boolean(row.renewal_reminders),
      renewalLeadDays: Number(row.renewal_lead_days),
      overdueAlerts: Boolean(row.overdue_alerts),
      weeklySummary: Boolean(row.weekly_summary),
    },
    appearance: {
      theme: THEMES.includes(row.theme) ? row.theme : DEFAULTS.appearance.theme,
    },
    preferences: {
      currency: row.currency || DEFAULTS.preferences.currency,
      defaultStatus: DEFAULT_STATUSES.includes(row.default_status)
        ? row.default_status
        : DEFAULTS.preferences.defaultStatus,
      dateFormat: row.date_format || DEFAULTS.preferences.dateFormat,
    },
  };
}

function toApiSettings(patch) {
  const body = {};
  const fields = {
    email: "email_notifications",
    renewalReminders: "renewal_reminders",
    renewalLeadDays: "renewal_lead_days",
    overdueAlerts: "overdue_alerts",
    weeklySummary: "weekly_summary",
    theme: "theme",
    currency: "currency",
    defaultStatus: "default_status",
    dateFormat: "date_format",
  };
  for (const [key, column] of Object.entries(fields)) {
    if (patch[key] !== undefined) body[column] = patch[key];
  }
  return body;
}

export async function loadAccountSettings() {
  const { settings } = await api("/settings");
  return fromApiSettings(settings);
}

export async function saveAccountSettings(patch) {
  const { settings } = await api("/settings", {
    method: "PUT",
    body: toApiSettings(patch),
  });
  return fromApiSettings(settings);
}

export async function resetAccountSettings() {
  const { settings } = await api("/settings", {
    method: "PUT",
    body: {
      email_notifications: DEFAULTS.notifications.email,
      renewal_reminders: DEFAULTS.notifications.renewalReminders,
      renewal_lead_days: DEFAULTS.notifications.renewalLeadDays,
      overdue_alerts: DEFAULTS.notifications.overdueAlerts,
      weekly_summary: DEFAULTS.notifications.weeklySummary,
      theme: DEFAULTS.appearance.theme,
      currency: DEFAULTS.preferences.currency,
      default_status: DEFAULTS.preferences.defaultStatus,
      date_format: DEFAULTS.preferences.dateFormat,
    },
  });
  return fromApiSettings(settings);
}

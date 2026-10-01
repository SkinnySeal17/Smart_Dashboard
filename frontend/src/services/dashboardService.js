// Dashboard data access: GET /api/dashboard on the Express API. The stats are
// calculated on the server (backend/express-app/src/services/dashboardStats.js).
import { api } from "./api";

export function fetchDashboard({ windowDays = 7, signal } = {}) {
  return api(`/dashboard?days=${encodeURIComponent(windowDays)}`, { signal });
}

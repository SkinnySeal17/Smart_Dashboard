import { useCallback, useEffect, useState } from "react";
import { fetchDashboard } from "../services/dashboardService";

/**
 * Dashboard stats from GET /api/dashboard for the logged-in user.
 * Returns { data, loading, error, reload }.
 */
export function useDashboard(windowDays) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchDashboard({ windowDays, signal: controller.signal })
      .then((result) => setData(result))
      .catch((e) => {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load dashboard.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [windowDays, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, loading, error, reload };
}

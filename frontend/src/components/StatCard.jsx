import { useCountUp } from "../hooks/useCountUp";
import { cn } from "../lib/cn";

/**
 * Simple metric tile. `value` may be a number (counts up) or a preformatted
 * string (shown as-is). `hint` is a small caption; `delta`/`trend` optional.
 */
export default function StatCard({ label, value, hint, delta, trend }) {
  const isNumber = typeof value === "number";
  const animated = useCountUp(isNumber ? value : 0);
  const n = isNumber && value >= 100 ? Math.round(animated) : value;
  const display =
    isNumber && value >= 1000 ? Math.round(n).toLocaleString("en-US") : n;

  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{display}</span>
      {delta != null ? (
        <span
          className={cn(
            "stat__delta",
            `stat__delta--${trend === "up" ? "up" : "down"}`,
          )}
        >
          {trend === "up" ? "▲" : "▼"} {Math.abs(delta)}%
          <span className="stat__delta-note">vs last month</span>
        </span>
      ) : (
        hint && <span className="stat__hint">{hint}</span>
      )}
    </div>
  );
}

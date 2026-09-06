import { formatMoney } from "../utils/format";

/**
 * Horizontal CSS bar chart. `rows` are { id, name, color, total } already
 * grouped; bar width is relative to the largest total.
 */
export default function CategorySpendChart({ rows, currency }) {
  const max = Math.max(0, ...rows.map((r) => r.total));

  return (
    <ul className="bar-chart">
      {rows.map((row) => {
        const amount = formatMoney(row.total, currency);
        const pct = max > 0 ? (row.total / max) * 100 : 0;
        return (
          <li key={row.id} className="bar-chart__row">
            <span className="chip" style={{ "--chip": row.color }}>
              {row.name}
            </span>
            <div
              className="bar-chart__track"
              role="img"
              aria-label={`${row.name} ${amount} per month`}
            >
              <div
                className="bar-chart__fill"
                style={{ width: `${pct}%`, background: row.color }}
              />
            </div>
            <span className="bar-chart__value">{amount}</span>
          </li>
        );
      })}
    </ul>
  );
}

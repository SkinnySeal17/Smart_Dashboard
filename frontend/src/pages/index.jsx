import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/StatCard";
import { useServices } from "../context/ServicesContext";
import { useSettings } from "../context/SettingsContext";
import { formatMoney, monthlyCost } from "../utils/format";
import { renewalLabel, daysUntil } from "../utils/date";

export default function DashboardPage() {
  const { services } = useServices();
  const { preferences } = useSettings();

  const active = services.filter((s) => s.status === "active");
  const monthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);
  const upcoming = [...services]
    .filter((s) => daysUntil(s.renewalDate) !== null)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Overview</h1>
      </div>

      <div className="stat-grid">
        <StatCard label="Services" value={services.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard
          label="Monthly spend"
          value={formatMoney(monthly, preferences.currency)}
        />
      </div>

      <Card
        title="Upcoming renewals"
        action={
          <Link className="auth__link" to="/services">
            All services
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <EmptyState>
            No services yet.{" "}
            <Link className="auth__link" to="/services/new">
              Add one
            </Link>
            .
          </EmptyState>
        ) : (
          <ul className="renewal-list">
            {upcoming.map((s) => {
              const r = renewalLabel(s.renewalDate);
              return (
                <li key={s.id} className="renewal-list__item">
                  <Link className="auth__link" to={`/services/${s.id}`}>
                    {s.name}
                  </Link>
                  <span className={r.overdue ? "text-warn" : "renewal-list__date"}>
                    {r.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

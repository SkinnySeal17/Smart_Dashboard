import StatCard from "../components/StatCard";
import { useServices } from "../context/ServicesContext";
import { useSettings } from "../context/SettingsContext";
import { formatMoney, monthlyCost } from "../utils/format";
import { formatDate, daysUntil } from "../utils/date";

export default function DashboardPage() {
  const { services } = useServices();
  const { preferences } = useSettings();

  const active = services.filter((s) => s.status === "active");
  const inactive = services.length - active.length;
  const monthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);

  const dated = [...services]
    .filter((s) => daysUntil(s.renewalDate) !== null)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  const next = dated.find((s) => daysUntil(s.renewalDate) >= 0) ?? dated[0];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Overview</h1>
        <p className="dashboard__sub">
          {services.length} service{services.length === 1 ? "" : "s"} ·{" "}
          {active.length} active
        </p>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Services"
          value={services.length}
          hint={`${active.length} active · ${inactive} inactive`}
        />
        <StatCard
          label="Monthly spend"
          value={formatMoney(monthly, preferences.currency)}
          hint={`≈ ${formatMoney(monthly * 12, preferences.currency)} / year`}
        />
        <StatCard
          label="Next renewal"
          value={next ? formatDate(next.renewalDate) : "—"}
          hint={next ? next.name : "nothing scheduled"}
        />
      </div>
    </div>
  );
}

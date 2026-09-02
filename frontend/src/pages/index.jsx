import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import StatCard from "../components/StatCard";
import { useServices } from "../context/ServicesContext";
import { useSettings } from "../context/SettingsContext";
import { formatMoney, monthlyCost } from "../utils/format";
import { formatDate, renewalLabel, daysUntil } from "../utils/date";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ICONS = {
  services: (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  spend: (
    <svg {...ICON_PROPS}>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4h5" />
    </svg>
  ),
  renewal: (
    <svg {...ICON_PROPS}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),
};

export default function DashboardPage() {
  const { services, loading, error, reload } = useServices();
  const { getCategory, preferences } = useSettings();

  const active = services.filter((s) => s.status === "active");
  const inactive = services.length - active.length;
  const monthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);

  const dated = [...services]
    .filter((s) => daysUntil(s.renewalDate) !== null)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  const overdue = dated.filter((s) => daysUntil(s.renewalDate) < 0);
  const next = dated.find((s) => daysUntil(s.renewalDate) >= 0) ?? dated[0];
  const upcoming = dated.slice(0, 3);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Overview</h1>
          {!loading && !error && (
            <p className="dashboard__sub">
              {services.length} service{services.length === 1 ? "" : "s"} ·{" "}
              {active.length} active
            </p>
          )}
        </div>
        <Button as={Link} to="/services/new">
          + Add service
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="stat-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="stat">
              <Skeleton lines={2} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              icon={ICONS.services}
              label="Services"
              value={services.length}
              hint={`${active.length} active · ${inactive} inactive`}
            />
            <StatCard
              icon={ICONS.spend}
              label="Monthly spend"
              value={formatMoney(monthly, preferences.currency)}
              hint={`≈ ${formatMoney(monthly * 12, preferences.currency)} / year`}
            />
            <StatCard
              icon={ICONS.renewal}
              label="Next renewal"
              value={next ? formatDate(next.renewalDate) : "—"}
              hint={next ? next.name : "nothing scheduled"}
            />
          </div>

          <Card
            title={
              <>
                Upcoming renewals
                {overdue.length > 0 && (
                  <Badge tone="warn">{overdue.length} overdue</Badge>
                )}
              </>
            }
            action={
              <Link className="auth__link" to="/services">
                All services →
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
                  const cat = getCategory(s.category);
                  return (
                    <li key={s.id} className="renewal-list__item">
                      <Link
                        className="auth__link renewal-list__name"
                        to={`/services/${s.id}`}
                      >
                        {s.name}
                      </Link>
                      <span className="renewal-list__meta">
                        {cat && (
                          <span className="chip" style={{ "--chip": cat.color }}>
                            {cat.name}
                          </span>
                        )}
                        <span
                          className={
                            r.overdue ? "text-warn" : "renewal-list__date"
                          }
                        >
                          {r.text}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

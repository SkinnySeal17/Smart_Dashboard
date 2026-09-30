import { loadServicesAsync } from "../../services/servicesService";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Skeleton from "../../components/ui/Skeleton";
import PageHeader from "../../components/ui/PageHeader";
import Flash from "../../components/ui/Flash";
import { useServices } from "../../context/ServicesContext";
import { useSettings } from "../../context/SettingsContext";
import { useFlash } from "../../hooks/useFlash";
import { renewalLabel } from "../../utils/date";
import {
  formatMoney,
  statusLabel,
  statusTone,
  billingCycleLabel,
  CYCLE_SUFFIX,
} from "../../utils/format";

export default function ServicesListPage() {
  const { services } = useServices();
  const { categories, getCategory, preferences } = useSettings();
  const flash = useFlash();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const reload = () => setAttempt(a => a + 1);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const result = await loadServicesAsync({ search: query.trim(), category_id: categoryFilter, status: statusFilter, billing_cycle: cycleFilter }, controller.signal);
        if (!controller.signal.aborted) setRows(result);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, categoryFilter, statusFilter, cycleFilter, attempt, services]);

  return (
    <div className="dashboard">
      {flash && <Flash>{flash}</Flash>}

      <PageHeader
        title="Services"
        actions={
          <Button as={Link} to="/services/new">
            Add service
          </Button>
        }
      />

      <Card
        title={loading ? "Loading services…" : `${rows.length} services`}
        action={
          <div className="list-filters">
            <input
              className="field__input field__input--inline"
              type="search"
              placeholder="Search name or notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search services by name or notes"
            />
            <select
              className="field__input field__input--inline"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className="field__input field__input--inline" aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <select className="field__input field__input--inline" aria-label="Filter by billing cycle" value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}>
              <option value="all">All billing cycles</option>
              {['monthly', 'quarterly', 'yearly', 'one_time'].map(c => <option key={c} value={c}>{billingCycleLabel(c)}</option>)}
            </select>
          </div>
        }
      >
        {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton lines={6} /> : rows.length === 0 ? (
          <EmptyState>
            No services match.{" "}
            <Link className="auth__link" to="/services/new">
              Add one
            </Link>
            .
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th className="table__num">Cost</th>
                  <th>Renewal</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const category = getCategory(s.category);
                  const renewal = renewalLabel(s.renewalDate);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link className="auth__link" to={`/services/${s.id}`}>
                          {s.name}
                        </Link>
                      </td>
                      <td>
                        {category ? (
                          <span
                            className="chip"
                            style={{ "--chip": category.color }}
                          >
                            {category.name}
                          </span>
                        ) : (
                          <span className="chip chip--muted">Unknown</span>
                        )}
                      </td>
                      <td className="table__num">
                        {formatMoney(s.cost, preferences.currency)}
                        <span className="table__unit">
                          {CYCLE_SUFFIX[s.billingCycle] ??
                            ` ${billingCycleLabel(s.billingCycle)}`}
                        </span>
                      </td>
                      <td className={renewal.overdue ? "text-warn" : undefined}>
                        {renewal.text}
                      </td>
                      <td>
                        <Badge tone={statusTone(s.status)}>
                          {statusLabel(s.status)}
                        </Badge>
                      </td>
                      <td className="table__num">
                        <Link
                          className="auth__link"
                          to={`/services/${s.id}/edit`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

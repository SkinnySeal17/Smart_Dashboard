import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { useServices } from "../../context/ServicesContext";
import { useSettings } from "../../context/SettingsContext";
import { formatDateTime, renewalLabel } from "../../utils/date";
import {
  formatMoney,
  statusLabel,
  statusTone,
  billingCycleLabel,
} from "../../utils/format";

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getService, deleteService } = useServices();
  const { getCategory, preferences } = useSettings();

  const service = getService(id);

  if (!service) {
    return (
      <div className="page-narrow">
        <Card title="Service not found">
          <p>No service matches this link — it may have been deleted.</p>
          <p>
            <Link className="auth__link" to="/services">
              Back to services
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const category = getCategory(service.category);
  const renewal = renewalLabel(service.renewalDate);
  const cycleLabel = billingCycleLabel(service.billingCycle);
  const costText = `${formatMoney(service.cost, preferences.currency)}${
    service.billingCycle === "one_time" ? "" : ` / ${cycleLabel.toLowerCase()}`
  }`;

  function handleDelete() {
    if (window.confirm(`Delete “${service.name}”? This can't be undone.`)) {
      deleteService(service.id);
      navigate("/services", { replace: true });
    }
  }

  return (
    <div className="page-narrow">
      <PageHeader
        title={service.name}
        back={
          <Link className="auth__link" to="/services">
            ← All services
          </Link>
        }
        actions={
          <>
            <Button as={Link} variant="ghost" to={`/services/${service.id}/edit`}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />

      <Card>
        <dl className="detail-grid">
          <div>
            <dt>Category</dt>
            <dd>
              {category ? (
                <span className="chip" style={{ "--chip": category.color }}>
                  {category.name}
                </span>
              ) : (
                <span className="chip chip--muted">Unknown</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>{costText}</dd>
          </div>
          <div>
            <dt>Billing cycle</dt>
            <dd>{cycleLabel}</dd>
          </div>
          <div>
            <dt>Renewal date</dt>
            <dd className={renewal.overdue ? "text-warn" : undefined}>
              {renewal.text}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <Badge tone={statusTone(service.status)}>
                {statusLabel(service.status)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDateTime(service.createdAt)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDateTime(service.updatedAt)}</dd>
          </div>
        </dl>

        <div className="detail-desc">
          <dt>Notes</dt>
          <dd>{service.notes ? service.notes : <em>No notes.</em>}</dd>
        </div>
      </Card>
    </div>
  );
}

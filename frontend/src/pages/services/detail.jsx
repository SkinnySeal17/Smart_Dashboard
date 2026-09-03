import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Flash from "../../components/ui/Flash";
import Skeleton from "../../components/ui/Skeleton";
import ErrorState from "../../components/ui/ErrorState";
import PageHeader from "../../components/ui/PageHeader";
import RenewalHistory from "../../components/detail/RenewalHistory";
import ServiceNotes from "../../components/detail/ServiceNotes";
import { useServices } from "../../context/ServicesContext";
import { useSettings } from "../../context/SettingsContext";
import { useFlash } from "../../hooks/useFlash";
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
  const { getService, deleteService, loading, error, reload } = useServices();
  const { getCategory, preferences } = useSettings();
  const flash = useFlash();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) {
    return (
      <div className="page-narrow">
        <Card title="Loading…">
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-narrow">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

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

  function confirmDelete() {
    const name = service.name;
    deleteService(service.id);
    navigate("/services", {
      replace: true,
      state: { flash: `Deleted “${name}”.` },
    });
  }

  return (
    <div className="page-narrow">
      {flash && <Flash>{flash}</Flash>}

      <PageHeader
        title={service.name}
        back={
          <Link className="auth__link" to="/services">
            ← All services
          </Link>
        }
        actions={
          <>
            <Button as={Link} variant="primary" to={`/services/${service.id}/edit`}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
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

        <RenewalHistory service={service} />
        <ServiceNotes notes={service.notes} />
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete service"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep service
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete service
            </Button>
          </>
        }
      >
        <p>
          Delete “{service.name}”? It will be removed from your services list.
          This can&rsquo;t be undone.
        </p>
      </Modal>
    </div>
  );
}

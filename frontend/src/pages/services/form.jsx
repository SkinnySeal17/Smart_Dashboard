import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import ServiceForm from "../../components/ServiceForm";
import { useServices } from "../../context/ServicesContext";
import { useSettings } from "../../context/SettingsContext";

export default function ServiceFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { getService, createService, updateService } = useServices();
  const { preferences } = useSettings();

  const existing = editing ? getService(id) : null;

  if (editing && !existing) {
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

  const initialValues = existing
    ? {
        name: existing.name,
        category: existing.category,
        cost: String(existing.cost),
        billingCycle: existing.billingCycle,
        renewalDate: existing.renewalDate ?? "",
        status: existing.status,
        notes: existing.notes ?? "",
      }
    : {
        name: "",
        category: "",
        cost: "",
        billingCycle: "monthly",
        renewalDate: "",
        status: preferences.defaultStatus,
        notes: "",
      };

  async function handleSubmit(values) {
    const saved = editing ? updateService(id, values) : createService(values);
    navigate(`/services/${saved.id}`, { replace: true });
  }

  return (
    <div className="page-narrow">
      <PageHeader
        title={editing ? "Edit service" : "Add service"}
        back={
          <Link
            className="auth__link"
            to={editing ? `/services/${id}` : "/services"}
          >
            ← {editing ? "Back to service" : "All services"}
          </Link>
        }
      />

      <Card>
        <ServiceForm
          initialValues={initialValues}
          submitLabel={editing ? "Save changes" : "Create service"}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(editing ? `/services/${id}` : "/services")
          }
        />
      </Card>
    </div>
  );
}

import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function AboutPage() {
  return (
    <div className="page-narrow">
      <PageHeader title="About" />

      <Card>
        <p>
          <strong>Smart Services Dashboard</strong> tracks the subscriptions and
          recurring services you pay for, so you can see monthly spend and
          upcoming renewals in one place.
        </p>
        <ul className="prose-list">
          <li>Total monthly spend and a yearly estimate.</li>
          <li>Add, edit, and delete a service with form validation.</li>
          <li>Search and filter by category; open any service for details.</li>
          <li>Manage categories and preferences on the Settings page.</li>
        </ul>
        <p className="field__hint">
          Built with React, React Router, and Vite. No backend — data is saved to
          this browser.
        </p>
      </Card>
    </div>
  );
}

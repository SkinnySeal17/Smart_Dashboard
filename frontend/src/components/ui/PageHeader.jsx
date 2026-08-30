/**
 * Page title row with optional back-link above it and actions on the right.
 *   <PageHeader title="Services" actions={<Button ...>Add</Button>} />
 */
export default function PageHeader({ title, back, actions }) {
  return (
    <div className="detail__top">
      <div>
        {back}
        <h1>{title}</h1>
      </div>
      {actions && <div className="form-actions">{actions}</div>}
    </div>
  );
}

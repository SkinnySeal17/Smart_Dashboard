import { useMemo, useState } from "react";
import {
  validateService,
  isValid,
  SERVICE_STATUSES,
  SERVICE_LIMITS,
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  EMPTY_SERVICE,
} from "../lib/validateService";
import { useSettings } from "../context/SettingsContext";
import Alert from "./ui/Alert";

const STATUS_LABELS = { active: "Active", inactive: "Inactive" };

/**
 * Reusable service form for both add and edit. Presentation only — the parent
 * decides what `onSubmit(values)` does. Validation comes from the standalone
 * validateService() so the rules stay testable without this component.
 */
export default function ServiceForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}) {
  const { categories } = useSettings();
  const [values, setValues] = useState(() => ({
    ...EMPTY_SERVICE,
    ...initialValues,
  }));
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(
    () => validateService(values, { categories }),
    [values, categories],
  );
  const fieldError = (field) =>
    (touched[field] || submitAttempted) && errors[field] ? errors[field] : "";

  const setField = (field) => (e) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));
  const markTouched = (field) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitError("");
    if (!isValid(errors)) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err?.message || "Something went wrong while saving.");
      setSubmitting(false);
    }
  }

  const notesLen = (values.notes ?? "").length;

  return (
    <form className="sform" onSubmit={handleSubmit} noValidate>
      {submitError && <Alert>{submitError}</Alert>}

      <label className="field">
        <span className="field__label">Name</span>
        <input
          type="text"
          value={values.name}
          onChange={setField("name")}
          onBlur={markTouched("name")}
          className={`field__input${fieldError("name") ? " field__input--error" : ""}`}
          placeholder="e.g. Figma Organization"
          aria-invalid={Boolean(fieldError("name"))}
        />
        {fieldError("name") && (
          <span className="field__error">{errors.name}</span>
        )}
      </label>

      <label className="field">
        <span className="field__label">Category</span>
        <select
          value={values.category}
          onChange={setField("category")}
          onBlur={markTouched("category")}
          className={`field__input${fieldError("category") ? " field__input--error" : ""}`}
          aria-invalid={Boolean(fieldError("category"))}
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError("category") && (
          <span className="field__error">{errors.category}</span>
        )}
      </label>

      <div className="sform__row sform__row--3">
        <label className="field">
          <span className="field__label">Cost</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={values.cost}
            onChange={setField("cost")}
            onBlur={markTouched("cost")}
            className={`field__input${fieldError("cost") ? " field__input--error" : ""}`}
            placeholder="0.00"
            aria-invalid={Boolean(fieldError("cost"))}
          />
          {fieldError("cost") && (
            <span className="field__error">{errors.cost}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Billing cycle</span>
          <select
            value={values.billingCycle}
            onChange={setField("billingCycle")}
            onBlur={markTouched("billingCycle")}
            className={`field__input${fieldError("billingCycle") ? " field__input--error" : ""}`}
            aria-invalid={Boolean(fieldError("billingCycle"))}
          >
            {BILLING_CYCLES.map((c) => (
              <option key={c} value={c}>
                {BILLING_CYCLE_LABELS[c]}
              </option>
            ))}
          </select>
          {fieldError("billingCycle") && (
            <span className="field__error">{errors.billingCycle}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Renewal date</span>
          <input
            type="date"
            value={values.renewalDate}
            onChange={setField("renewalDate")}
            onBlur={markTouched("renewalDate")}
            className={`field__input${fieldError("renewalDate") ? " field__input--error" : ""}`}
            aria-invalid={Boolean(fieldError("renewalDate"))}
          />
          {fieldError("renewalDate") && (
            <span className="field__error">{errors.renewalDate}</span>
          )}
        </label>
      </div>

      <fieldset className="field sform__status">
        <legend className="field__label">Status</legend>
        <div className="segmented">
          {SERVICE_STATUSES.map((s) => (
            <label
              key={s}
              className={`segmented__opt${values.status === s ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={values.status === s}
                onChange={setField("status")}
              />
              {STATUS_LABELS[s]}
            </label>
          ))}
        </div>
        {fieldError("status") && (
          <span className="field__error">{errors.status}</span>
        )}
      </fieldset>

      <label className="field">
        <span className="field__label">
          Notes <span className="field__hint">optional</span>
        </span>
        <textarea
          rows={4}
          value={values.notes}
          onChange={setField("notes")}
          onBlur={markTouched("notes")}
          className={`field__input field__input--area${fieldError("notes") ? " field__input--error" : ""}`}
          placeholder="Seats, billing owner, cancellation terms…"
          aria-invalid={Boolean(fieldError("notes"))}
        />
        <span
          className={`field__counter${notesLen > SERVICE_LIMITS.notes.max ? " field__counter--over" : ""}`}
        >
          {notesLen}/{SERVICE_LIMITS.notes.max}
        </span>
        {fieldError("notes") && (
          <span className="field__error">{errors.notes}</span>
        )}
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

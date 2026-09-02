import { useMemo, useRef, useState } from "react";
import {
  validateService,
  serviceWarnings,
  isValid,
  SERVICE_STATUSES,
  SERVICE_LIMITS,
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  EMPTY_SERVICE,
} from "../lib/validateService";
import { useSettings } from "../context/SettingsContext";
import Alert from "./ui/Alert";
import TextField from "./forms/TextField";
import SelectField from "./forms/SelectField";
import DateField from "./forms/DateField";
import TextareaField from "./forms/TextareaField";

const STATUS_LABELS = { active: "Active", inactive: "Inactive" };
// Order used to move focus to the first field with an error on submit.
const FIELD_ORDER = ["name", "category", "cost", "billingCycle", "renewalDate", "notes"];

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
  const formRef = useRef(null);

  const errors = useMemo(
    () => validateService(values, { categories }),
    [values, categories],
  );
  const warnings = useMemo(() => serviceWarnings(values), [values]);
  const invalid = !isValid(errors);

  const shownError = (field) =>
    (touched[field] || submitAttempted) && errors[field] ? errors[field] : "";

  const setField = (field) => (e) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));
  const markTouched = (field) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitError("");

    if (invalid) {
      const firstBad = FIELD_ORDER.find((f) => errors[f]);
      if (firstBad) formRef.current?.querySelector(`#sf-${firstBad}`)?.focus();
      return;
    }

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
    <form ref={formRef} className="sform" onSubmit={handleSubmit} noValidate>
      {submitError && <Alert>{submitError}</Alert>}

      <TextField
        id="sf-name"
        label="Name"
        value={values.name}
        onChange={setField("name")}
        onBlur={markTouched("name")}
        error={shownError("name")}
        placeholder="e.g. Figma Organization"
        autoComplete="off"
      />

      <SelectField
        id="sf-category"
        label="Category"
        value={values.category}
        onChange={setField("category")}
        onBlur={markTouched("category")}
        error={shownError("category")}
        placeholder="Select a category…"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />

      <div className="sform__row sform__row--3">
        <TextField
          id="sf-cost"
          label="Cost"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={values.cost}
          onChange={setField("cost")}
          onBlur={markTouched("cost")}
          error={shownError("cost")}
          placeholder="0.00"
        />
        <SelectField
          id="sf-billingCycle"
          label="Billing cycle"
          value={values.billingCycle}
          onChange={setField("billingCycle")}
          onBlur={markTouched("billingCycle")}
          error={shownError("billingCycle")}
          options={BILLING_CYCLES.map((c) => ({
            value: c,
            label: BILLING_CYCLE_LABELS[c],
          }))}
        />
        <DateField
          id="sf-renewalDate"
          label="Renewal date"
          value={values.renewalDate}
          onChange={setField("renewalDate")}
          onBlur={markTouched("renewalDate")}
          error={shownError("renewalDate")}
          warning={warnings.renewalDate}
        />
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
      </fieldset>

      <TextareaField
        id="sf-notes"
        label="Notes"
        hint="optional"
        rows={4}
        value={values.notes}
        onChange={setField("notes")}
        onBlur={markTouched("notes")}
        error={shownError("notes")}
        placeholder="Seats, billing owner, cancellation terms…"
        counter={`${notesLen}/${SERVICE_LIMITS.notes.max}`}
        counterOver={notesLen > SERVICE_LIMITS.notes.max}
      />

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting || invalid}
        >
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

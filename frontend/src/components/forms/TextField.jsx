import FormError from "./FormError";
import { cn } from "../../lib/cn";

/**
 * Labelled text input with an explicit <label htmlFor> and aria-describedby
 * wiring for the error / hint text.
 */
export default function TextField({
  id,
  label,
  hint,
  error,
  warning,
  type = "text",
  className,
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const warnId = warning ? `${id}-warn` : undefined;
  const describedBy =
    [errorId, warnId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("field", className)}>
      <label className="field__label" htmlFor={id}>
        {label}
        {hint && (
          <span id={hintId} className="field__hint">
            {" "}
            {hint}
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        className={cn("field__input", error && "field__input--error")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {warning && !error && (
        <span id={warnId} className="field__note field__note--warn">
          {warning}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
}

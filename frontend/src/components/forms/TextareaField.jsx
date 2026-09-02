import FormError from "./FormError";
import { cn } from "../../lib/cn";

export default function TextareaField({
  id,
  label,
  hint,
  error,
  counter,
  counterOver,
  className,
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

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
      <textarea
        id={id}
        className={cn(
          "field__input",
          "field__input--area",
          error && "field__input--error",
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {counter && (
        <span
          className={cn("field__counter", counterOver && "field__counter--over")}
        >
          {counter}
        </span>
      )}
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
}

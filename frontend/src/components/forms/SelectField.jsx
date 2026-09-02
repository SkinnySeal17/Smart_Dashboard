import FormError from "./FormError";
import { cn } from "../../lib/cn";

export default function SelectField({
  id,
  label,
  error,
  options = [],
  placeholder,
  className,
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("field", className)}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={cn("field__input", error && "field__input--error")}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FormError id={errorId}>{error}</FormError>
    </div>
  );
}

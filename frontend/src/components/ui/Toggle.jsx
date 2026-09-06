import { useId } from "react";

/**
 * Accessible on/off switch. Renders a real checkbox with role="switch" so screen
 * readers announce the label and state; the visible "On/Off" text and the knob
 * position mean state is never communicated by colour alone.
 *
 *   <Toggle label="Email notifications" description="…" checked={x} onChange={setX} />
 */
export default function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  const id = useId();
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div className="toggle">
      <span className="toggle__text">
        <label className="toggle__label" htmlFor={id}>
          {label}
        </label>
        {description && (
          <span id={descId} className="toggle__desc">
            {description}
          </span>
        )}
      </span>
      <span className="toggle__control">
        <span className="toggle__state" aria-hidden="true">
          {checked ? "On" : "Off"}
        </span>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="toggle__input"
          checked={checked}
          disabled={disabled}
          aria-describedby={descId}
          onChange={(e) => onChange(e.target.checked)}
        />
      </span>
    </div>
  );
}

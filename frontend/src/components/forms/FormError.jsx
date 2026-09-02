/** Inline field error. Give it an id and point the input's aria-describedby at it. */
export default function FormError({ id, children }) {
  if (!children) return null;
  return (
    <span id={id} className="field__error">
      {children}
    </span>
  );
}

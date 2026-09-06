/** Transient success/status banner. role="status" so screen readers announce it. */
export default function Flash({ children }) {
  if (!children) return null;
  return (
    <div className="flash" role="status">
      {children}
    </div>
  );
}

import { cn } from "../../lib/cn";

export default function Card({ title, action, children, className = "" }) {
  return (
    <section className={cn("card", className)}>
      {(title || action) && (
        <header className="card__head">
          {title && <h2 className="card__title">{title}</h2>}
          {action}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}

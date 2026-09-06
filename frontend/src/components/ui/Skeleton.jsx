import { cn } from "../../lib/cn";

/** Placeholder shimmer while async content loads. Decorative — hidden from AT. */
export default function Skeleton({ lines = 3, className }) {
  return (
    <div className={cn("skeleton", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="skeleton__bar" />
      ))}
    </div>
  );
}

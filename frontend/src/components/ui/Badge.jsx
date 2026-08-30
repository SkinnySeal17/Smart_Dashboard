import { cn } from "../../lib/cn";

/** tone: "ok" | "warn" | "muted" */
export default function Badge({ tone = "muted", className, children }) {
  return <span className={cn("badge", `badge--${tone}`, className)}>{children}</span>;
}

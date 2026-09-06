import { cn } from "../../lib/cn";

/**
 * Thin wrapper over the .btn CSS classes.
 *   <Button variant="primary" size="sm">Save</Button>
 *   <Button as={Link} variant="ghost" to="/x">Edit</Button>
 */
export default function Button({
  as: As = "button",
  variant = "primary",
  size,
  className,
  type,
  ...props
}) {
  return (
    <As
      className={cn("btn", `btn--${variant}`, size && `btn--${size}`, className)}
      type={As === "button" ? (type ?? "button") : type}
      {...props}
    />
  );
}

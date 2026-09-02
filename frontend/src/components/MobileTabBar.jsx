import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services" },
  { to: "/settings", label: "Settings" },
  { to: "/about", label: "About" },
];

/** Bottom navigation shown on small screens (sidebar is hidden there). */
export default function MobileTabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `tabbar__link${isActive ? " is-active" : ""}`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

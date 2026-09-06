import { Link, NavLink } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/services", label: "Services" },
  { to: "/settings", label: "Settings" },
  { to: "/about", label: "About" },
];

function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function Sidebar() {
  const { profile } = useSettings();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          ◆
        </span>
        <span>
          Smart
          <br />
          Services
        </span>
      </div>

      <nav aria-label="Primary">
        <ul className="sidebar__nav">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? " is-active" : ""}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__spacer" />

      <Link
        to="/settings"
        className="sidebar__user"
        aria-label="Open profile settings"
      >
        <span className="sidebar__avatar" aria-hidden="true">
          {initials(profile.name)}
        </span>
        <span className="sidebar__user-meta">
          <span className="sidebar__user-name">
            {profile.name || "Your profile"}
          </span>
          <span className="sidebar__user-email">{profile.email}</span>
        </span>
      </Link>
    </aside>
  );
}

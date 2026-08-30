import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <header className="topbar">
          <input
            className="topbar__search"
            type="search"
            placeholder="Search…"
            aria-label="Search"
          />
          <div className="topbar__right">
            <span className="topbar__bell" aria-hidden="true">🔔</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileTabBar from "./MobileTabBar";

export default function DashboardLayout() {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div className="layout__main">
        <main id="main-content" className="content">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}

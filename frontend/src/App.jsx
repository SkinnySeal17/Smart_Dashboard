import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { ServicesProvider } from "./context/ServicesContext";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/index";
import AboutPage from "./pages/about";
import SettingsPage from "./pages/settings";
import ServicesListPage from "./pages/services/index";
import ServiceDetailPage from "./pages/services/detail";
import ServiceFormPage from "./pages/services/form";

function App() {
  return (
    <SettingsProvider>
      <ServicesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="services" element={<ServicesListPage />} />
              <Route path="services/new" element={<ServiceFormPage />} />
              <Route path="services/:id" element={<ServiceDetailPage />} />
              <Route path="services/:id/edit" element={<ServiceFormPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            {/* stray URLs (old /login, /register, typos) -> dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ServicesProvider>
    </SettingsProvider>
  );
}

export default App;

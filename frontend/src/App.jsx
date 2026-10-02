import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { ServicesProvider } from "./context/ServicesContext";
import DashboardLayout from "./components/DashboardLayout";
import LandingPage from "./components/LandingPage";
import DashboardPage from "./pages/index";
import AboutPage from "./pages/about";
import SettingsPage from "./pages/settings";
import ProfilePage from "./pages/profile";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import ServicesListPage from "./pages/services/index";
import ServiceDetailPage from "./pages/services/detail";
import ServiceFormPage from "./pages/services/form";
import useAuthToken from "./hooks/useAuthToken";

function AuthenticatedApp() {
  return (
    <SettingsProvider>
      <ServicesProvider>
        <DashboardLayout />
      </ServicesProvider>
    </SettingsProvider>
  );
}

function AppRoutes() {
  const token = useAuthToken();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <RegisterPage />} />
      {token ? (
        <Route element={<AuthenticatedApp />}>
          <Route index element={<DashboardPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesListPage />} />
          <Route path="services/new" element={<ServiceFormPage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route path="services/:id/edit" element={<ServiceFormPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

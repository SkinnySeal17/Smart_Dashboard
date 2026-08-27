import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ServicesProvider } from "./context/ServicesContext";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./pages/Dashboard";
import ServicesList from "./pages/ServicesList";
import ServiceDetail from "./pages/ServiceDetail";
import AddEditService from "./pages/AddEditService";
import Settings from "./pages/Settings";

function App() {
  return (
    <ServicesProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/services" element={<ServicesList />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/services/new" element={<AddEditService />} />
          <Route path="/services/:id/edit" element={<AddEditService />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </ServicesProvider>
  );
}

export default App;
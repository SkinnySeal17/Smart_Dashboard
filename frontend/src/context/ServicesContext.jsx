import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadServices,
  saveServices,
  makeService,
  applyUpdate,
} from "../services/servicesService";

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const [services, setServices] = useState(loadServices);

  useEffect(() => {
    saveServices(services);
  }, [services]);

  const value = useMemo(
    () => ({
      services,

      getService: (id) => services.find((s) => s.id === id) ?? null,

      createService: (data) => {
        const record = makeService(data);
        setServices((list) => [record, ...list]);
        return record;
      },

      updateService: (id, data) => {
        const current = services.find((s) => s.id === id);
        if (!current) return null;
        const updated = applyUpdate(current, data);
        setServices((list) => list.map((s) => (s.id === id ? updated : s)));
        return updated;
      },

      deleteService: (id) =>
        setServices((list) => list.filter((s) => s.id !== id)),

      countByCategory: (categoryId) =>
        services.filter((s) => s.category === categoryId).length,
    }),
    [services],
  );

  return (
    <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within a ServicesProvider");
  return ctx;
}

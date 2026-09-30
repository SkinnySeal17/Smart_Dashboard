import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loadServicesAsync,
  removeService,
  makeService,
  applyUpdate,
} from "../services/servicesService";

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadServicesAsync();
      setServices(data);

    } catch (e) {
      setError(e?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      services,
      loading,
      error,
      reload: load,

      getService: (id) => services.find((s) => s.id === id) ?? null,

      createService: async (data) => {
        const record = await makeService(data);
        setServices((list) => [record, ...list]);
        return record;
      },

      updateService: async (id, data) => {
        const current = services.find((s) => s.id === id);
        if (!current) return null;
        const updated = await applyUpdate(current, data);
        setServices((list) => list.map((s) => (s.id === id ? updated : s)));
        return updated;
      },

      deleteService: async (id) => {
        await removeService(id);
        setServices((list) => list.filter((s) => s.id !== id));
      },

      countByCategory: (categoryId) =>
        services.filter((s) => s.category === categoryId).length,
    }),
    [services, loading, error, load],
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

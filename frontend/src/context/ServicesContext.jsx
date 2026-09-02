import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  loadServicesAsync,
  saveServices,
  makeService,
  applyUpdate,
} from "../services/servicesService";

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadServicesAsync();
      setServices(data);
      loadedOnce.current = true;
    } catch (e) {
      setError(e?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Persist only after the first successful load, so the empty initial state
  // never overwrites what's in storage.
  useEffect(() => {
    if (loadedOnce.current) saveServices(services);
  }, [services]);

  const value = useMemo(
    () => ({
      services,
      loading,
      error,
      reload: load,

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

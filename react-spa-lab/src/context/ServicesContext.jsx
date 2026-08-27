import { createContext, useContext, useState, useEffect } from 'react';
import mockServices from '../data/services.json';

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulated async fetch - swap this for a real API call in Assessment 3
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        setServices(mockServices);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load services');
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  function addService(newService) {
    setServices(prev => [
      ...prev,
      { ...newService, id: crypto.randomUUID() }
    ]);
  }

  function updateService(id, updatedFields) {
    setServices(prev =>
      prev.map(service =>
        service.id === id ? { ...service, ...updatedFields } : service
      )
    );
  }

  function deleteService(id) {
    setServices(prev => prev.filter(service => service.id !== id));
  }

  function getServiceById(id) {
    return services.find(service => service.id === id);
  }

  const value = {
    services,
    isLoading,
    error,
    addService,
    updateService,
    deleteService,
    getServiceById
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Reads a one-shot success message passed via router state
 * (`navigate(to, { state: { flash: "..." } })`), auto-clears it after `timeout`
 * ms, and scrubs it from history so a refresh won't show it again.
 */
export function useFlash(timeout = 4000) {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(location.state?.flash || "");

  useEffect(() => {
    if (location.state?.flash) {
      setMessage(location.state.flash);
      navigate(location.pathname + location.search, {
        replace: true,
        state: null,
      });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(""), timeout);
    return () => clearTimeout(t);
  }, [message, timeout]);

  return message;
}

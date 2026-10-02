import { useEffect, useState } from "react";
import { getToken } from "../services/api";

export default function useAuthToken() {
  const [token, setTokenState] = useState(getToken);

  useEffect(() => {
    const sync = () => setTokenState(getToken());
    window.addEventListener("auth-change", sync);
    return () => window.removeEventListener("auth-change", sync);
  }, []);

  return token;
}

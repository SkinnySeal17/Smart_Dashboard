import { api, setToken } from './api';

export async function logout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await api('/auth/logout', { method: 'POST', signal: controller.signal });
  } catch {
    // Signing out locally must also work when the API is unavailable or expired.
  } finally {
    clearTimeout(timeout);
    setToken(null);
  }
}

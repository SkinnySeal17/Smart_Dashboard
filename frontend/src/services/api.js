const TOKEN_KEY = 'smart-dashboard.token';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('auth-change'));
}
export async function api(path, { body, ...options } = {}) {
  const token = getToken();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) setToken(null);
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }
  return data;
}

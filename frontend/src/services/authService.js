import { api, setToken } from './api';

export async function registerAccount({ name, email, password }) {
  return api('/auth/register', { method: 'POST', body: { name, email, password } });
}

export async function loginAccount({ email, password }) {
  const result = await api('/auth/login', { method: 'POST', body: { email, password } });
  setToken(result.token);
  return result.user;
}

/** The logged-in user's account details: { id, name, email }. */
export async function getCurrentUser() {
  const { user } = await api('/auth/me');
  return user;
}

export async function getProfile() {
  const { user } = await api('/profile');
  return user;
}

export async function updateProfile({ name, email }) {
  const { user } = await api('/profile', { method: 'PUT', body: { name, email } });
  return user;
}

export async function changePassword({ currentPassword, newPassword }) {
  return api('/profile/password', {
    method: 'PUT',
    preserveSession: true,
    body: { currentPassword, newPassword },
  });
}

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

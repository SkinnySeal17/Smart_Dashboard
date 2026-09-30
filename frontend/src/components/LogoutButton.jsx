import { useState } from 'react';
import { logout } from '../services/authService';

export default function LogoutButton({ className = 'btn btn--ghost' }) {
  const [busy, setBusy] = useState(false);
  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    await logout();
  }
  return <button type="button" className={className} disabled={busy} onClick={handleLogout}>
    {busy ? 'Logging out…' : 'Log out'}
  </button>;
}

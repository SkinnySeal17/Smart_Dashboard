import { useEffect, useState } from 'react';
import { api, getToken, setToken } from '../services/api';

export default function AuthGate({ children }) {
  const [token, updateToken] = useState(getToken);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';
  useEffect(() => {
    const changed = () => {
      const nextToken = getToken();
      if (!nextToken) {
        setMode('login'); setEmail(''); setError(''); setNotice('');
      }
      updateToken(nextToken);
    };
    window.addEventListener('auth-change', changed);
    return () => window.removeEventListener('auth-change', changed);
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = form.get('password');
    setError(''); setNotice('');
    if (registering && password !== form.get('confirmation')) {
      setError('Passwords do not match.'); return;
    }
    if (registering && (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))) {
      setError('Password must include a letter and a number.'); return;
    }
    if (registering && !form.get('name').trim()) {
      setError('Name is required.'); return;
    }
    setBusy(true);
    try {
      const body = { email: email.trim(), password };
      if (registering) {
        await api('/auth/register', { method: 'POST', body: { ...body, name: form.get('name').trim() } });
        setMode('login');
        setNotice('Account created. Sign in with your email and password.');
      } else {
        const result = await api('/auth/login', { method: 'POST', body });
        setToken(result.token);
      }
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  if (token) return children;
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
    <section className="auth__card" style={{ width: '100%', maxWidth: '460px' }} aria-labelledby="auth-title">
      <h1 id="auth-title" className="auth__title">{registering ? 'Create your account' : 'Sign in'}</h1>
      <p className="auth__subtitle">{registering ? 'Start managing your services and categories.' : 'Welcome back to your dashboard.'}</p>
      {notice && <p role="status">{notice}</p>}
      <form key={mode} className="sform" onSubmit={submit}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
          {registering && <label>Name<input className="field__input" name="name" autoComplete="name" maxLength={100} required /></label>}
          <label>Email<input className="field__input" type="email" name="email" autoComplete="username" maxLength={255} value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Password<input className="field__input" type="password" name="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : undefined} maxLength={registering ? 72 : undefined} aria-describedby={registering ? 'password-hint' : undefined} required /></label>
          {registering && <>
            <p id="password-hint">Use 8–72 characters, including a letter and a number.</p>
            <label>Confirm password<input className="field__input" type="password" name="confirmation" autoComplete="new-password" required /></label>
          </>}
          {error && <p className="auth__alert" role="alert">{error}</p>}
          <button className="btn btn--primary" type="submit">{busy ? (registering ? 'Creating account…' : 'Signing in…') : (registering ? 'Create account' : 'Sign in')}</button>
        </fieldset>
      </form>
      <p>{registering ? 'Already have an account?' : 'New here?'}{' '}
        <button className="btn btn--ghost" disabled={busy} onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); setNotice(''); }}>
          {registering ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </section>
  </main>;
}

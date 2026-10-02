import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginAccount } from "../services/authService";
import Alert from "../components/ui/Alert";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const notice = location.state?.notice || "";

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await loginAccount({ email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth__card" aria-labelledby="login-title">
        <div className="auth__top">
          <Link className="auth__brand" to="/">
            <span className="auth__logo" aria-hidden="true">◆</span>
            Smart Services
          </Link>
          <Link className="homelink" to="/">← Home</Link>
        </div>
        <h1 id="login-title" className="auth__title">Sign in</h1>
        <p className="auth__subtitle">Welcome back to your dashboard.</p>
        {notice && <p role="status">{notice}</p>}
        {error && <Alert>{error}</Alert>}
        <form className="sform" onSubmit={submit} noValidate>
          <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "16px" }}>
            <label>
              Email
              <input
                className="field__input"
                type="email"
                name="email"
                autoComplete="username"
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                className="field__input"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="btn btn--primary" type="submit">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </fieldset>
        </form>
        <p className="auth__hint">
          New here? <Link className="auth__link" to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerAccount } from "../services/authService";
import Alert from "../components/ui/Alert";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required.";
    else if (name.trim().length > 100) errors.name = "Name must be 100 characters or fewer.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    else if (password.length > 72) errors.password = "Password must be 72 characters or fewer.";
    else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      errors.password = "Password must include an uppercase letter, a lowercase letter, a number, and a symbol.";
    }
    if (password !== confirmation) errors.confirmation = "Passwords do not match.";
    return errors;
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const errors = validate();
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      await registerAccount({ name: name.trim(), email: email.trim(), password });
      navigate("/login", {
        replace: true,
        state: { notice: "Account created. Sign in with your email and password." },
      });
    } catch (err) {
      setError(err.message);
      if (err.errors) setFieldErrors(err.errors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth__card" aria-labelledby="register-title">
        <div className="auth__top">
          <Link className="auth__brand" to="/">
            <span className="auth__logo" aria-hidden="true">◆</span>
            Smart Services
          </Link>
          <Link className="homelink" to="/">← Home</Link>
        </div>
        <h1 id="register-title" className="auth__title">Create your account</h1>
        <p className="auth__subtitle">Start managing your services and categories.</p>
        {error && <Alert>{error}</Alert>}
        <form className="sform" onSubmit={submit} noValidate>
          <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "16px" }}>
            <label>
              Name
              <input className="field__input" name="name" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required />
              {fieldErrors.name && <span className="field__error">{fieldErrors.name}</span>}
            </label>
            <label>
              Email
              <input className="field__input" type="email" name="email" autoComplete="username" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} required />
              {fieldErrors.email && <span className="field__error">{fieldErrors.email}</span>}
            </label>
            <label>
              Password
              <input className="field__input" type="password" name="password" autoComplete="new-password" minLength={8} maxLength={72} aria-describedby="password-hint" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <p id="password-hint" className="field__hint">Use 8–72 characters with an uppercase letter, a lowercase letter, a number, and a symbol.</p>
              {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
            </label>
            <label>
              Confirm password
              <input className="field__input" type="password" name="confirmation" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              {fieldErrors.confirmation && <span className="field__error">{fieldErrors.confirmation}</span>}
            </label>
            <button className="btn btn--primary" type="submit">
              {busy ? "Creating account…" : "Create account"}
            </button>
          </fieldset>
        </form>
        <p className="auth__hint">
          Already have an account? <Link className="auth__link" to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

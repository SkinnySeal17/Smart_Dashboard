import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Flash from "../components/ui/Flash";
import TextField from "../components/forms/TextField";
import Alert from "../components/ui/Alert";
import { useSettings } from "../context/SettingsContext";
import { changePassword, getProfile, updateProfile } from "../services/authService";
import { validateProfile } from "../lib/validateProfile";

export default function ProfilePage() {
  const { setProfile } = useSettings();
  const [draft, setDraft] = useState({ name: "", email: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmation: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((user) => {
        if (cancelled) return;
        setDraft({ name: user.name, email: user.email });
        setProfile({ name: user.name, email: user.email });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setProfile]);

  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;
    const errors = validateProfile(draft);
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const user = await updateProfile({ name: draft.name.trim(), email: draft.email.trim() });
      setDraft({ name: user.name, email: user.email });
      setProfile({ name: user.name, email: user.email });
      setFlash("Profile saved.");
    } catch (err) {
      setError(err.message);
      if (err.errors) setFieldErrors(err.errors);
    } finally {
      setSaving(false);
    }
  }

  function validatePassword() {
    const errors = {};
    if (!passwords.currentPassword) errors.currentPassword = "Current password is required.";
    if (!passwords.newPassword) errors.newPassword = "New password is required.";
    else if (passwords.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters.";
    else if (passwords.newPassword.length > 72) errors.newPassword = "Password must be 72 characters or fewer.";
    else if (
      !/[a-z]/.test(passwords.newPassword) ||
      !/[A-Z]/.test(passwords.newPassword) ||
      !/[0-9]/.test(passwords.newPassword) ||
      !/[^A-Za-z0-9]/.test(passwords.newPassword)
    ) {
      errors.newPassword = "Password must include an uppercase letter, a lowercase letter, a number, and a symbol.";
    } else if (passwords.newPassword === passwords.currentPassword) {
      errors.newPassword = "New password must be different from the current password.";
    }
    if (passwords.newPassword !== passwords.confirmation) {
      errors.confirmation = "Passwords do not match.";
    }
    return errors;
  }

  async function savePassword(event) {
    event.preventDefault();
    if (passwordSaving) return;
    const errors = validatePassword();
    setPasswordErrors(errors);
    setError("");
    if (Object.keys(errors).length > 0) return;
    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmation: "" });
      setFlash("Password updated.");
    } catch (err) {
      setError(err.message);
      if (err.errors) setPasswordErrors(err.errors);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="page-narrow settings">
      <PageHeader title="Profile" />
      <p className="settings__intro">Update the name and email on your account, or change your password.</p>
      {loading && <p role="status">Loading profile…</p>}
      {error && <Alert>{error}</Alert>}
      {flash && <Flash>{flash}</Flash>}

      <Card title="Account">
        <form className="sform" onSubmit={saveProfile} noValidate>
          <div className="sform__row">
            <TextField
              id="profile-name"
              label="Full name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              error={fieldErrors.name}
              maxLength={100}
              autoComplete="name"
              disabled={loading || saving}
            />
            <TextField
              id="profile-email"
              label="Email address"
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              error={fieldErrors.email}
              maxLength={255}
              autoComplete="email"
              disabled={loading || saving}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit" disabled={loading || saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Password">
        <form className="sform" onSubmit={savePassword} noValidate>
          <TextField
            id="current-password"
            label="Current password"
            type="password"
            value={passwords.currentPassword}
            onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
            error={passwordErrors.currentPassword}
            autoComplete="current-password"
            disabled={loading || passwordSaving}
          />
          <div className="sform__row">
            <TextField
              id="new-password"
              label="New password"
              type="password"
              hint="Use 8–72 characters with an uppercase letter, a lowercase letter, a number, and a symbol."
              value={passwords.newPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
              maxLength={72}
              disabled={loading || passwordSaving}
            />
            <TextField
              id="confirm-password"
              label="Confirm new password"
              type="password"
              value={passwords.confirmation}
              onChange={(event) => setPasswords((current) => ({ ...current, confirmation: event.target.value }))}
              error={passwordErrors.confirmation}
              autoComplete="new-password"
              disabled={loading || passwordSaving}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit" disabled={loading || passwordSaving}>
              {passwordSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

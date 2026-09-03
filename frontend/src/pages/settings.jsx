import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Flash from "../components/ui/Flash";
import Toggle from "../components/ui/Toggle";
import TextField from "../components/forms/TextField";
import SelectField from "../components/forms/SelectField";
import { useSettings } from "../context/SettingsContext";
import { useServices } from "../context/ServicesContext";
import { validateCategory, CATEGORY_LIMITS } from "../lib/validateService";
import { validateProfile, PROFILE_LIMITS } from "../lib/validateProfile";
import { THEMES, DATE_FORMATS, RENEWAL_LEAD_DAYS } from "../services/settingsService";

const PALETTE = [
  "#aa3bff",
  "#3b82f6",
  "#16a34a",
  "#d97706",
  "#e11d48",
  "#0891b2",
  "#7c3aed",
  "#65a30d",
];

const THEME_LABELS = { light: "Light", dark: "Dark", system: "System" };
const DATE_FORMAT_LABELS = { short: "Short", medium: "Medium", long: "Long" };
const SAMPLE_DATE = new Date(2027, 0, 2); // 2 Jan 2027, for the live preview

function dateSample(style) {
  try {
    return SAMPLE_DATE.toLocaleDateString("en-US", { dateStyle: style });
  } catch {
    return "";
  }
}

function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function SettingsPage() {
  const {
    profile,
    categories,
    notifications,
    appearance,
    preferences,
    updateProfile,
    updateNotifications,
    setTheme,
    updatePreferences,
    addCategory,
    updateCategory,
    deleteCategory,
    resetSettings,
  } = useSettings();
  const { countByCategory } = useServices();

  // One shared status region for "saved automatically" feedback.
  const [flash, setFlash] = useState("");
  const flashTimer = useRef(null);
  function announce(message) {
    setFlash(message);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(""), 3500);
  }
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // ---- Profile (explicit Save, matching the Service form pattern) ----------
  const [profileDraft, setProfileDraft] = useState(profile);
  const [profileTouched, setProfileTouched] = useState({});
  const [profileSubmitted, setProfileSubmitted] = useState(false);

  // Keep the draft in step if the profile changes elsewhere (e.g. Reset).
  useEffect(() => {
    setProfileDraft(profile);
    setProfileTouched({});
    setProfileSubmitted(false);
  }, [profile]);

  const profileErrors = useMemo(
    () => validateProfile(profileDraft),
    [profileDraft],
  );
  const profileDirty =
    profileDraft.name !== profile.name || profileDraft.email !== profile.email;
  const profileFieldError = (field) =>
    (profileTouched[field] || profileSubmitted) && profileErrors[field]
      ? profileErrors[field]
      : "";

  function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileSubmitted(true);
    if (Object.keys(profileErrors).length > 0) return;
    updateProfile(profileDraft);
    announce("Profile saved to this browser.");
  }

  // ---- Categories --------------------------------------------------------
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [newError, setNewError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  const [pendingDelete, setPendingDelete] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    const errors = validateCategory({ name: newName }, { categories });
    if (errors.name) {
      setNewError(errors.name);
      return;
    }
    addCategory({ name: newName, color: newColor });
    setNewName("");
    setNewColor(PALETTE[0]);
    setNewError("");
    announce("Category added.");
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditError("");
  }

  function saveEdit(id) {
    const errors = validateCategory(
      { name: editName },
      { categories, currentId: id },
    );
    if (errors.name) {
      setEditError(errors.name);
      return;
    }
    updateCategory(id, { name: editName });
    setEditingId(null);
    setEditError("");
    announce("Category renamed.");
  }

  function confirmDelete() {
    if (pendingDelete) {
      deleteCategory(pendingDelete.id);
      announce("Category deleted.");
    }
    setPendingDelete(null);
  }

  function confirmReset() {
    resetSettings();
    setResetOpen(false);
    announce("All settings restored to defaults.");
  }

  return (
    <div className="page-narrow settings">
      <PageHeader
        title="Settings"
        actions={
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            Reset to defaults
          </Button>
        }
      />
      <p className="settings__intro">
        Manage your profile, notifications, appearance, and dashboard
        preferences. This app has no backend — everything here is saved to this
        browser only.
      </p>

      {flash && <Flash>{flash}</Flash>}

      {/* -------------------------------- Profile ------------------------- */}
      <Card title="Profile">
        <div className="profile-head">
          <span className="profile-head__avatar" aria-hidden="true">
            {initials(profile.name)}
          </span>
          <span className="profile-head__meta">
            <span className="profile-head__name">{profile.name || "—"}</span>
            <span className="profile-head__email">{profile.email || "—"}</span>
          </span>
        </div>

        <form className="sform" onSubmit={handleProfileSubmit} noValidate>
          <div className="sform__row">
            <TextField
              id="profile-name"
              label="Full name"
              value={profileDraft.name}
              onChange={(e) =>
                setProfileDraft((d) => ({ ...d, name: e.target.value }))
              }
              onBlur={() =>
                setProfileTouched((t) => ({ ...t, name: true }))
              }
              error={profileFieldError("name")}
              maxLength={PROFILE_LIMITS.name.max + 10}
              autoComplete="name"
            />
            <TextField
              id="profile-email"
              label="Email address"
              type="email"
              value={profileDraft.email}
              onChange={(e) =>
                setProfileDraft((d) => ({ ...d, email: e.target.value }))
              }
              onBlur={() =>
                setProfileTouched((t) => ({ ...t, email: true }))
              }
              error={profileFieldError("email")}
              maxLength={PROFILE_LIMITS.email.max}
              autoComplete="email"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!profileDirty}
            >
              Save profile
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setProfileDraft(profile);
                setProfileTouched({});
                setProfileSubmitted(false);
              }}
              disabled={!profileDirty}
            >
              Cancel
            </button>
            <span className="settings__status" role="status">
              {profileDirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        </form>
      </Card>

      {/* ----------------------------- Notifications --------------------- */}
      <Card title="Notifications">
        <p className="field__hint settings__note">
          Choose which reminders you want. Preferences are stored locally — this
          demo doesn&rsquo;t actually send email. Changes save automatically.
        </p>

        <div className="toggle-list">
          <Toggle
            label="Email notifications"
            description="Master switch for every reminder below."
            checked={notifications.email}
            onChange={(v) => {
              updateNotifications({ email: v });
              announce(v ? "Email notifications on." : "Email notifications off.");
            }}
          />
          <Toggle
            label="Renewal reminders"
            description="Get a heads-up before a service renews."
            checked={notifications.renewalReminders}
            disabled={!notifications.email}
            onChange={(v) => {
              updateNotifications({ renewalReminders: v });
              announce("Notification preference saved.");
            }}
          />

          {notifications.email && notifications.renewalReminders && (
            <div className="toggle-list__sub">
              <SelectField
                id="notif-lead"
                label="Remind me this many days before renewal"
                value={String(notifications.renewalLeadDays)}
                onChange={(e) => {
                  updateNotifications({
                    renewalLeadDays: Number(e.target.value),
                  });
                  announce("Reminder timing saved.");
                }}
                options={RENEWAL_LEAD_DAYS.map((d) => ({
                  value: String(d),
                  label: `${d} day${d === 1 ? "" : "s"} before`,
                }))}
              />
            </div>
          )}

          <Toggle
            label="Overdue alerts"
            description="Alert me when a renewal date has passed."
            checked={notifications.overdueAlerts}
            disabled={!notifications.email}
            onChange={(v) => {
              updateNotifications({ overdueAlerts: v });
              announce("Notification preference saved.");
            }}
          />
          <Toggle
            label="Weekly spend summary"
            description="A Monday email with your monthly spend and upcoming renewals."
            checked={notifications.weeklySummary}
            disabled={!notifications.email}
            onChange={(v) => {
              updateNotifications({ weeklySummary: v });
              announce("Notification preference saved.");
            }}
          />
        </div>
      </Card>

      {/* ------------------------------ Appearance ---------------------- */}
      <Card title="Appearance">
        <fieldset className="field sform__status">
          <legend className="field__label">Theme</legend>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <label
                key={t}
                className={`segmented__opt${
                  appearance.theme === t ? " is-active" : ""
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={appearance.theme === t}
                  onChange={() => {
                    setTheme(t);
                    announce(`Theme set to ${THEME_LABELS[t]}.`);
                  }}
                />
                {THEME_LABELS[t]}
              </label>
            ))}
          </div>
          <p className="field__hint">
            “System” follows your device’s light / dark setting. Your choice is
            kept as you move between pages.
          </p>
        </fieldset>
      </Card>

      {/* ------------------------------ Preferences -------------------- */}
      <Card title="Preferences">
        <div className="sform__row sform__row--3">
          <div className="field">
            <label className="field__label" htmlFor="pref-currency">
              Currency symbol
            </label>
            <input
              id="pref-currency"
              className="field__input"
              value={preferences.currency}
              maxLength={3}
              aria-describedby="pref-currency-hint"
              onChange={(e) =>
                updatePreferences({ currency: e.target.value })
              }
              onBlur={() => announce("Preference saved.")}
            />
            <span id="pref-currency-hint" className="field__hint">
              Shown next to every amount.
            </span>
          </div>

          <SelectField
            id="pref-status"
            label="Default status for new services"
            value={preferences.defaultStatus}
            onChange={(e) => {
              updatePreferences({ defaultStatus: e.target.value });
              announce("Preference saved.");
            }}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />

          <SelectField
            id="pref-dateformat"
            label="Date format"
            value={preferences.dateFormat}
            onChange={(e) => {
              updatePreferences({ dateFormat: e.target.value });
              announce("Preference saved.");
            }}
            options={DATE_FORMATS.map((f) => ({
              value: f,
              label: `${DATE_FORMAT_LABELS[f]} — ${dateSample(f)}`,
            }))}
          />
        </div>
        <p className="field__hint settings__note">
          Preferences apply across the dashboard and save automatically.
        </p>
      </Card>

      {/* ------------------------------ Categories -------------------- */}
      <Card title="Categories">
        <ul className="cat-list">
          {categories.map((cat) => {
            const inUse = countByCategory(cat.id);
            const isEditing = editingId === cat.id;
            return (
              <li key={cat.id} className="cat-list__item">
                <span
                  className="cat-list__swatch"
                  style={{ background: cat.color }}
                  aria-hidden="true"
                />
                {isEditing ? (
                  <span className="cat-list__editwrap">
                    <input
                      className={`field__input field__input--inline${
                        editError ? " field__input--error" : ""
                      }`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={CATEGORY_LIMITS.name.max + 5}
                      aria-label={`Rename ${cat.name}`}
                      autoFocus
                    />
                    {editError && (
                      <span className="field__error">{editError}</span>
                    )}
                  </span>
                ) : (
                  <span className="cat-list__name">{cat.name}</span>
                )}
                <span className="cat-list__meta">
                  {inUse} service{inUse === 1 ? "" : "s"}
                </span>
                <span className="form-actions">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => saveEdit(cat.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => startEdit(cat)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setPendingDelete(cat)}
                        disabled={inUse > 0}
                        title={
                          inUse > 0 ? "In use by services" : "Delete category"
                        }
                      >
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <form className="cat-add" onSubmit={handleAdd}>
          <div className="field">
            <label className="field__label" htmlFor="new-cat">
              New category
            </label>
            <input
              id="new-cat"
              className={`field__input${newError ? " field__input--error" : ""}`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Marketing"
              maxLength={CATEGORY_LIMITS.name.max + 5}
              aria-invalid={Boolean(newError)}
            />
            {newError && <span className="field__error">{newError}</span>}
          </div>

          <div
            className="swatches"
            role="radiogroup"
            aria-label="Category colour"
          >
            {PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                className={`swatch${newColor === c ? " is-active" : ""}`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
                aria-pressed={newColor === c}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>

          <button type="submit" className="btn btn--primary">
            Add category
          </button>
        </form>
      </Card>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete category"
        actions={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Delete the “{pendingDelete?.name}” category?</p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all settings"
        actions={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReset}>
              Reset everything
            </Button>
          </>
        }
      >
        <p>
          This restores the profile, notifications, appearance, preferences and
          categories to their defaults on this browser. Your services are not
          affected. This can&rsquo;t be undone.
        </p>
      </Modal>
    </div>
  );
}

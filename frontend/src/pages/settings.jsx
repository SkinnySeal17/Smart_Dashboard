import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Flash from "../components/ui/Flash";
import Toggle from "../components/ui/Toggle";
import SelectField from "../components/forms/SelectField";
import { useSettings } from "../context/SettingsContext";
import { useServices } from "../context/ServicesContext";
import { validateCategory, CATEGORY_LIMITS } from "../lib/validateService";
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
const DATE_FORMAT_LABELS = {
  "DD/MM/YYYY": "Day/Month/Year",
  "MM/DD/YYYY": "Month/Day/Year",
  "YYYY-MM-DD": "Year-Month-Day",
};

function dateSample(format) {
  if (format === "MM/DD/YYYY") return "01/02/2027";
  if (format === "YYYY-MM-DD") return "2027-01-02";
  if (format === "DD/MM/YYYY") return "02/01/2027";
  return format;
}

function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function SettingsPage() {
  const {
    profile,
    categories, categoriesLoading, categoriesError, reloadCategories,
    notifications,
    appearance,
    preferences,
    updateNotifications,
    setTheme,
    updatePreferences,
    addCategory,
    updateCategory,
    deleteCategory,
    resetSettings,
    settingsLoading,
    settingsError,
    reloadSettings,
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

  // ---- Categories --------------------------------------------------------
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [newError, setNewError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  const [pendingDelete, setPendingDelete] = useState(null);
  const [currencyDraft, setCurrencyDraft] = useState(preferences.currency);
  useEffect(() => {
    setCurrencyDraft(preferences.currency);
  }, [preferences.currency]);
  const [resetOpen, setResetOpen] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    const errors = validateCategory({ name: newName }, { categories });
    if (errors.name) {
      setNewError(errors.name);
      return;
    }
    try { await addCategory({ name: newName, color: newColor }); }
    catch (err) { setNewError(err.message); return; }
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

  async function saveEdit(id) {
    const errors = validateCategory(
      { name: editName },
      { categories, currentId: id },
    );
    if (errors.name) {
      setEditError(errors.name);
      return;
    }
    try { await updateCategory(id, { name: editName }); }
    catch (err) { setEditError(err.message); return; }
    setEditingId(null);
    setEditError("");
    announce("Category renamed.");
  }

  async function confirmDelete() {
    if (pendingDelete) {
      try { await deleteCategory(pendingDelete.id); }
      catch (err) { announce(err.message); setPendingDelete(null); return; }
      announce("Category deleted.");
    }
    setPendingDelete(null);
  }

  async function savePreference(action, message) {
    try {
      await action();
      announce(message);
    } catch (err) {
      announce(err.message);
    }
  }

  async function confirmReset() {
    try {
      await resetSettings();
      setResetOpen(false);
      announce("Settings restored to defaults.");
    } catch (err) {
      setResetOpen(false);
      announce(err.message);
    }
  }

  return (
    <div className="page-narrow settings">
      {settingsLoading && <p role="status">Loading settings…</p>}
      {settingsError && (
        <p role="alert">
          {settingsError} <button type="button" onClick={reloadSettings}>Retry</button>
        </p>
      )}
      {categoriesLoading && <p role="status">Loading categories…</p>}
      {categoriesError && <p role="alert">{categoriesError} <button onClick={reloadCategories}>Retry</button></p>}
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
        preferences.
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
        <Link className="auth__link" to="/profile">Edit profile or password</Link>
      </Card>

      {/* ----------------------------- Notifications --------------------- */}
      <Card title="Notifications">
        <p className="field__hint settings__note">
          Choose which reminders you want.
        </p>

        <div className="toggle-list">
          <Toggle
            label="Email notifications"
            checked={notifications.email}
            onChange={(v) => {
              savePreference(
                () => updateNotifications({ email: v }),
                v ? "Email notifications on." : "Email notifications off.",
              );
            }}
          />
          <Toggle
            label="Renewal reminders"
            description="Get a heads-up before a service renews."
            checked={notifications.renewalReminders}
            disabled={!notifications.email}
            onChange={(v) => {
              savePreference(
                () => updateNotifications({ renewalReminders: v }),
                "Notification preference saved.",
              );
            }}
          />

          {notifications.email && notifications.renewalReminders && (
            <div className="toggle-list__sub">
              <SelectField
                id="notif-lead"
                label="Remind me this many days before renewal"
                value={String(notifications.renewalLeadDays)}
                onChange={(e) => {
                  savePreference(
                    () => updateNotifications({ renewalLeadDays: Number(e.target.value) }),
                    "Reminder timing saved.",
                  );
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
              savePreference(
                () => updateNotifications({ overdueAlerts: v }),
                "Notification preference saved.",
              );
            }}
          />
          <Toggle
            label="Weekly spend summary"
            description="A email with your monthly spend and upcoming renewals."
            checked={notifications.weeklySummary}
            disabled={!notifications.email} 
            onChange={(v) => {
              savePreference(
                () => updateNotifications({ weeklySummary: v }),
                "Notification preference saved.",
              );
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
                    savePreference(
                      () => setTheme(t),
                      `Theme set to ${THEME_LABELS[t]}.`,
                    );
                  }}
                />
                {THEME_LABELS[t]}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {/* ------------------------------ Preferences -------------------- */}
      <Card title="Preferences">
        <div className="sform__row sform__row--3">
          <div className="field">
            <label className="field__label" htmlFor="pref-currency">
              Currency
            </label>
            <input
              id="pref-currency"
              className="field__input"
              value={currencyDraft}
              maxLength={10}
              aria-describedby="pref-currency-hint"
              onChange={(e) => setCurrencyDraft(e.target.value)}
              onBlur={() => {
                if (currencyDraft === preferences.currency) return;
                savePreference(
                  () => updatePreferences({ currency: currencyDraft }),
                  "Preference saved.",
                );
              }}
            />
            <span id="pref-currency-hint" className="field__hint">
            </span>
          </div>

          <SelectField
            id="pref-status"
            label="Default status for new services"
            value={preferences.defaultStatus}
            onChange={(e) => {
              savePreference(
                () => updatePreferences({ defaultStatus: e.target.value }),
                "Preference saved.",
              );
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
              savePreference(
                () => updatePreferences({ dateFormat: e.target.value }),
                "Preference saved.",
              );
            }}
            options={DATE_FORMATS.map((f) => ({
              value: f,
              label: `${DATE_FORMAT_LABELS[f]} — ${dateSample(f)}`,
            }))}
          />
        </div>
        <p className="field__hint settings__note">
        </p>
      </Card>

      {/* ------------------------------ Categories -------------------- */}
      <div id="categories" />
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
          This restores notifications, appearance and preferences to their
          account defaults. Your services and categories are not affected.
        </p>
      </Modal>
    </div>
  );
}

import { useState } from "react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useServices } from "../context/ServicesContext";
import { validateCategory, CATEGORY_LIMITS } from "../lib/validateService";

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

export default function SettingsPage() {
  const {
    categories,
    preferences,
    addCategory,
    updateCategory,
    deleteCategory,
    updatePreferences,
  } = useSettings();
  const { countByCategory } = useServices();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [newError, setNewError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  const [pendingDelete, setPendingDelete] = useState(null);

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
  }

  function confirmDelete() {
    if (pendingDelete) deleteCategory(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="page-narrow">
      <PageHeader title="Settings" />

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
                      className={`field__input field__input--inline${editError ? " field__input--error" : ""}`}
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

      <Card title="Preferences">
        <div className="sform__row">
          <div className="field">
            <label className="field__label" htmlFor="pref-currency">
              Currency symbol
            </label>
            <input
              id="pref-currency"
              className="field__input"
              value={preferences.currency}
              maxLength={3}
              onChange={(e) => updatePreferences({ currency: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pref-status">
              Default status for new services
            </label>
            <select
              id="pref-status"
              className="field__input"
              value={preferences.defaultStatus}
              onChange={(e) =>
                updatePreferences({ defaultStatus: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <p className="field__hint">
          Preferences and categories are saved to this browser only.
        </p>
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
    </div>
  );
}

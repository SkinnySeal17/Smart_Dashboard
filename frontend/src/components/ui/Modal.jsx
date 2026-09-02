import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: role="dialog" + aria-modal, focus trap, Escape to close,
 * restores focus to the trigger on close, click-outside to dismiss.
 */
export default function Modal({ open, onClose, title, children, actions }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const panel = panelRef.current;

    const items = () => Array.from(panel.querySelectorAll(FOCUSABLE));
    (items()[0] || panel).focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const list = items();
        if (list.length === 0) {
          e.preventDefault();
          return;
        }
        const i = list.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          list[list.length - 1].focus();
        } else if (!e.shiftKey && i === list.length - 1) {
          e.preventDefault();
          list[0].focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {title && (
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
        )}
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}

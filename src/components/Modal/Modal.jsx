import React, { useEffect, useId, useRef } from "react";
import "./Modal.scss";

// Two shapes, one component. Without `onConfirm` this is the notification it has
// always been — a single Close button — so the existing Checkout and Contact
// call sites render exactly as before. With `onConfirm` it becomes a
// confirmation: Cancel (onClose) and Confirm, both disabled while `busy` so a
// slow request cannot be submitted twice.
const Modal = ({
  show,
  success,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
}) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!show) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    const safeAction = dialog?.querySelector(
      ".modal-cancel:not(:disabled), button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])"
    );

    document.body.style.overflow = "hidden";
    (safeAction || dialog)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [show]);

  if (!show) return null;

  // A confirmation is neither a success nor a failure, so it opts out of the
  // green/red border the notification variants use.
  const variant = onConfirm ? "confirm" : success ? "success" : "error";

  return (
    <div className="modal-overlay">
      <div
        ref={dialogRef}
        className={`modal-box ${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) {
            event.preventDefault();
            onClose();
            return;
          }

          if (event.key !== "Tab") return;

          const focusable = [...event.currentTarget.querySelectorAll(
            "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])"
          )];
          if (!focusable.length) {
            event.preventDefault();
            event.currentTarget.focus();
          } else if (event.shiftKey && document.activeElement === focusable[0]) {
            event.preventDefault();
            focusable.at(-1).focus();
          } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
            event.preventDefault();
            focusable[0].focus();
          }
        }}
      >
        <h2 id={titleId} className="modal-title">{title}</h2>
        <p>{message}</p>
        {onConfirm ? (
          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
              disabled={busy}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="modal-confirm"
              onClick={onConfirm}
              disabled={busy}
            >
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  );
};

export default Modal;

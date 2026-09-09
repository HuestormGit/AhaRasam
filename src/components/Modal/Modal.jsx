import React from "react";
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
  if (!show) return null;

  // A confirmation is neither a success nor a failure, so it opts out of the
  // green/red border the notification variants use.
  const variant = onConfirm ? "confirm" : success ? "success" : "error";

  return (
    <div className="modal-overlay">
      <div className={`modal-box ${variant}`}>
        <h3>{title}</h3>
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

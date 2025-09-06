import React from "react";
import "./Modal.scss";

const Modal = ({ show, success, title, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-box ${success ? "success" : "error"}`}>
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;

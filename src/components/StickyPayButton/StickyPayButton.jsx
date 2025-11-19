import React, { useContext } from 'react'
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./StickyPayButton.scss";

function StickyPayButton() {
    const {cart} =useContext(CartContext);
     const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  return (
    <div className="sticky-proceed-global">
          <button className="proceed-btn" onClick={() => navigate("/cart")}>
            {totalItems > 0
              ? `${totalItems} products added — Proceed to Pay`
              : `Proceed to Pay`}
          </button>
        </div>
  )
}

export default StickyPayButton
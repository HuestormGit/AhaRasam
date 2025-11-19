import React, { useContext } from 'react'
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./StickyPayButton.scss";

function StickyPayButton() {
    const {cart} =useContext(CartContext);
    const navigate = useNavigate();  
     const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  return (
    <div className="sticky-proceed-global">
        {totalItems > 0
              ? `${totalItems} products added`
              : `0 Products added `}
          <button className="proceed-btn" onClick={() => navigate("/cart")}>
            Proceed to Pay
          </button>
        </div>
  )
}

export default StickyPayButton
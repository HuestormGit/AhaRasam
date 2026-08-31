import React, { useContext } from 'react'
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./StickyPayButton.scss";

function StickyPayButton() {
    const {cart} =useContext(CartContext);
    const navigate = useNavigate();  
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    // Fixed bar sits over the footer on every page — only show it once there is
    // something to pay for.
    if (totalItems === 0) return null;

  return (
    <div className="sticky-proceed-global">
        <span className="producttxt">
            {totalItems > 0
              ? `${totalItems} products added`
              : `0 Products added `}
        </span>
        
        <button className="proceed-btn" onClick={() => navigate("/cart")}> Proceed to Pay</button>
    </div>
  )
}

export default StickyPayButton
import React, { useContext } from 'react'
import { CartContext } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./StickyPayButton.scss";

function StickyPayButton() {
    // Units, not rows, and never counting a line the catalogue cannot sell —
    // the same number the header badge shows.
    const {itemCount} =useContext(CartContext);
    const navigate = useNavigate();  
    const totalItems = itemCount;

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
import React, { useContext } from 'react'
import { CartContext } from "../../context/CartContext";
import { useLocation, useNavigate } from "react-router-dom";
import "./StickyPayButton.scss";

// An allowlist, not a blocklist: this bar is a shortcut to the cart, so it only
// belongs on pages where the customer is still browsing — today just the home
// page. Everywhere else it is redundant (/cart), actively harmful (/checkout,
// where its z-index 9999 covers the real Pay button and navigates away) or
// noise (auth, account, policy, 404). A new browsing route opts in here.
const SHOW_ON_PATHS = ["/"];

function StickyPayButton() {
    // Units, not rows, and never counting a line the catalogue cannot sell —
    // the same number the header badge shows.
    const {itemCount} =useContext(CartContext);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const totalItems = itemCount;

    // Fixed bar sits over the footer on every page — only show it once there is
    // something in the cart, and only where it is wanted.
    if (totalItems === 0 || !SHOW_ON_PATHS.includes(pathname)) return null;

  return (
    <div className="sticky-proceed-global">
        <span className="producttxt">
            {totalItems > 0
              ? `${totalItems} products added`
              : `0 Products added `}
        </span>
        
        <button className="proceed-btn" onClick={() => navigate("/cart")}>Go to Cart</button>
    </div>
  )
}

export default StickyPayButton

import React, { useContext, useState } from "react";
import CheckoutPopup from "../Checkout/CheckoutPopup";
import { CartContext } from "../../context/CartContext";
import "./Cart.scss";

const Cart = () => {
  const { cart, removeFromCart } = useContext(CartContext);
  const [showCheckout, setShowCheckout] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="cart-container container-fluid p-0">
      <div className="navbg"></div>
      <div className="container">
        <h2>Your Cart</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty!</p>
        ) : (
          <>
            <ul>
              {cart.map((item, idx) => (
                <li key={idx}>
                  <div>
                    <strong>{item.productName}</strong> ({item.size}) - ₹
                    {item.price} × {item.qty} = ₹{item.price * item.qty}
                  </div>
                  <button onClick={() => removeFromCart(idx)}>Remove</button>
                </li>
              ))}
            </ul>
            <h3>Total: ₹{totalAmount}</h3>
            <button onClick={() => setShowCheckout(true)}>Proceed to Pay</button>
          </>
        )}

        {showCheckout && (
          <CheckoutPopup
            cartData={cart}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Cart;

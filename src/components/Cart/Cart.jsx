import React, { useContext, useState } from "react";
import { CartContext } from "../../context/CartContext";
import "./Cart.scss";
import Checkout from "../Checkout/Checkout";.
import { trash } from "../../assets/trash.png";

const Cart = () => {
  const { cart, setCart } = useContext(CartContext); // ✅ make sure CartContext provides setCart
  const [showCheckout, setShowCheckout] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // 🔹 Increase qty
  const handleIncrease = (idx) => {
    const updatedCart = [...cart];
    updatedCart[idx].qty += 1;
    setCart(updatedCart);
  };

  // 🔹 Decrease qty
  const handleDecrease = (idx) => {
    const updatedCart = [...cart];
    if (updatedCart[idx].qty > 1) {
      updatedCart[idx].qty -= 1;
      setCart(updatedCart);
    } else {
      handleRemove(idx); // if qty = 0 → remove product
    }
  };

  // 🔹 Delete product
  const handleRemove = (idx) => {
    const updatedCart = cart.filter((_, i) => i !== idx);
    setCart(updatedCart);
  };

  return (
    <div className="cart-container container-fluid p-0">
      <div className="navbg"></div>
      <div className="container">
        <section className="cart-section">
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p className="no-product">Your cart is empty!</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead className="red-dark">
                    <tr className="tableheadingrow">
                      <th>Product</th>
                      <th>Weight</th>
                      <th>Amount</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} className="tabledatarow">
                        <td>
                          <h4>{item.productName}</h4>
                        </td>
                        <td>
                          <p>{item.size}</p>
                        </td>
                        <td>
                          <p>₹{item.price * item.qty}</p>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {/* <button
                              className="trash-btn"
                              onClick={() => handleRemove(idx)}
                            >
                              🗑
                            </button> */}
                            <img src={trash} alt="remove" className="trash"/>
                            
                            <div className="varqty-sec">
                              <button
                                className="qty-btn qty-btn-left"
                                onClick={() => handleDecrease(idx)}
                              >
                                -
                              </button>
                              <span className="qty-value">{item.qty}</span>
                              <button
                                className="qty-btn qty-btn-right"
                                onClick={() => handleIncrease(idx)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2"></td>
                      <td>
                        <h3>Total</h3>
                      </td>
                      <td>
                        <h3>₹{totalAmount}</h3>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button
                className="checkout-btn"
                onClick={() => setShowCheckout(true)}
              >
                Proceed To Checkout
              </button>
            </>
          )}
        </section>

        {showCheckout && (
          <Checkout cartData={cart} onClose={() => setShowCheckout(false)} />
        )}
      </div>
    </div>
  );
};

export default Cart;

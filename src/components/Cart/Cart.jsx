import React, { useContext, useState } from "react";
import CheckoutPopup from "../Checkout/CheckoutPopup";
import { CartContext } from "../../context/CartContext";
import "./Cart.scss";
import Checkout from "../Checkout/Checkout";

const Cart = () => {
  const { cart, removeFromCart } = useContext(CartContext);
  const [showCheckout, setShowCheckout] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="cart-container container-fluid p-0">
      <div className="navbg"></div>
      <div className="container">
        <section className="cart-section">
          <h2>Cart</h2>
          {
            cart.length === 0 ? (
            <p>Your cart is empty!</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table">
                    <thead class="red-dark">
                      <tr className="tableheadingrow">
                        <th>Product</th>
                        <th>Weight</th>
                        <th>Amout</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                  
                      {cart.map((item, idx) => ( 
                        <tr key={idx} className="tabledatarow">
                          <td><h4>{item.productName}</h4></td>
                          <td><p>{item.size}</p></td>
                          <td><p> ₹{item.price * item.qty} </p></td>
                          <td>
                            <div className="d-flex align-items-center">
                            <button className="trash-btn">🗑</button>
                            <div className="varqty-sec">
                              <button
                                className="qty-btn qty-btn-left"
                                // onClick={() => handleQtyChange(product.id, idx, -1)}
                              >
                                -
                              </button>
                              <span className="qty-value">
                                {item.qty}
                              </span>
                              <button
                                className="qty-btn qty-btn-right"
                                // onClick={() => handleQtyChange(product.id, idx, 1)}
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
                        <th> <h3>Total </h3></th>
                        <th colspan="2" class="text-end">₹{totalAmount}</th>
                        <th>$35</th>
                      </tr>
                    </tfoot>

                  </table>
                </div>
                
                {/* <ul>
                  {cart.map((item, idx) => (
                    <li key={idx}>
                      <div>
                        <strong>{item.productName}</strong> ({item.size}) - ₹
                        {item.price} × {item.qty} = ₹{item.price * item.qty}
                      </div>
                      <button onClick={() => removeFromCart(idx)}>Remove</button>
                    </li>
                  ))}
                </ul> */}
                
                {/* <button onClick={() => setShowCheckout(true)}>Proceed To Chekout</button> */}
                <button className="checkout-btn" onClick={() => setShowCheckout(true)}> Proceed To Checkout</button>
              </>
            )
          }
        </section>

        
        

        {/* {showCheckout && (
          <CheckoutPopup
            cartData={cart}
            onClose={() => setShowCheckout(false)}
          />
          
        )} */}
        {/* <p>with razorpay check data save in strapi or not :-</p>
          <CheckoutPopup
            cartData={cart}
            onClose={() => setShowCheckout(false)}
          /> */}
        {/* <p>without razorpay data save in strapi </p> */}
        {showCheckout && (
          <Checkout
            cartData={cart}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Cart;

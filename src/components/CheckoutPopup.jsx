import React from "react";
import axios from "axios";

const CheckoutPopup = ({ cartData, onClose }) => {
  const totalAmount = cartData.variants.reduce(
    (sum, v) => sum + v.price * v.qty,
    0
  );

  const createOrder = async () => {
    try {
      const res = await axios.post("http://localhost:1337/api/orders", {
        amount: totalAmount , // Razorpay expects amount in paise totalAmount * 100
        currency: "INR",
      });

      const { razorpayOrder } = res.data;

      const options = {
        key: "rzp_test_R5AxLBFpboBciJ", // Replace with your Razorpay key
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "My Shop",
        description: cartData.title,
        order_id: razorpayOrder.id,
        handler: function (response) {
          alert("Payment Successful!");
          console.log(response);
          onClose();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Order Summary</h2>
        <ul>
          {cartData.variants.map((v, idx) => (
            <li key={idx}>
              {v.size} - ₹{v.price} × {v.qty} = ₹{v.price * v.qty}
            </li>
          ))}
        </ul>
        <h3>Total: ₹{totalAmount}</h3>
        <button onClick={createOrder}>Pay Now</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CheckoutPopup;

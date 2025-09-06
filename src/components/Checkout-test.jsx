// src/components/Checkout.jsx
import React from "react";
import axios from "axios";

const Checkout = () => {
  const createOrder = async (amount) => {
    try {
      const res = await axios.post("http://localhost:1337/api/orders", {
        amount,
        currency: "INR",
      });

      const { razorpayOrder } = res.data;

      const options = {
        key: "rzp_test_R5AxLBFpboBciJ", // <-- replace with your Razorpay key
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "My Shop",
        description: "Test Transaction",
        order_id: razorpayOrder.id,
        handler: function (response) {
          alert("Payment Successful!");
          console.log(response);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <button onClick={() => createOrder(500)}>Pay ₹500</button>
    </div>
  );
};

export default Checkout;

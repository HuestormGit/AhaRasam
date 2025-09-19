import React, { useState } from "react";
import axios from "axios";
import { postDataToApi } from "../../utils/Api";

const Checkout = ({ cartData, onClose }) => {
  const [form, setForm] = useState({ name: "", email: "", contact: "" });

  const totalAmount = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    try {
      // 1️⃣ Call Strapi to create Razorpay order
      // const res = await axios.post("http://localhost:1337/api/orders/razorpay/create", {
      //   amount: totalAmount,
      // });
      const res = await axios.post(`${process.env.REACT_APP_STRAPI_URL}api/orders/razorpay/create`, {
        amount: totalAmount,
      });

      const { id: razorpayOrderId, amount } = res.data.data;

      // 2️⃣ Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount,
        currency: "INR",
        name: "AHA! Rasam",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response) {
          // 3️⃣ Verify + Save in Strapi
          // await axios.post("http://localhost:1337/api/orders/razorpay/verify", {
          await axios.post(`${process.env.REACT_APP_STRAPI_URL}api/orders/razorpay/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderData: {
              customerName: form.name,
              email: form.email,
              phoneNumber: form.contact,
              totalAmount,
              items: cartData,
            },
          });

          alert("✅ Payment successful & order saved!");
          localStorage.removeItem("cartList");
          window.location.href = "/?thankyou=true";
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.contact,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("❌ Payment error:", err);
      alert("Something went wrong during payment!");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Checkout</h2>

        <ul>
          {cartData.map((item, idx) => (
            <li key={idx}>
              {item.productName} ({item.size}) - ₹{item.price} × {item.qty} = ₹
              {item.price * item.qty}
            </li>
          ))}
        </ul>
        <h3>Total: ₹{totalAmount}</h3>

        <input
          type="text"
          name="name"
          placeholder="Enter Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="contact"
          placeholder="Enter Contact"
          value={form.contact}
          onChange={handleChange}
        />

        <button onClick={handlePayment}>Pay with Razorpay</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Checkout;

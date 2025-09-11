import React, { useState } from "react";
import axios from "axios";

const CheckoutPopup = ({ cartData, onClose }) => {
  const [form, setForm] = useState({ name: "", email: "", contact: "" });

  const totalAmount = cartData.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createOrder = async () => {
    try {
      // 1️⃣ Ask Strapi backend to create Razorpay order
      const res = await axios.post(
        `${process.env.REACT_APP_STRAPI_URL}api/razorpay/order`,
        { amount: totalAmount, currency: "INR" }
      );

      const { order } = res.data;

      // 2️⃣ Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Aha Rasam",
        description: "Order Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3️⃣ Send payment details + customer/order data to backend
            const verifyRes = await axios.post(
              `${process.env.REACT_APP_STRAPI_URL}api/razorpay/verify`,
              {
                ...response,
                customerName: form.name,
                email: form.email,
                phoneNumber: form.contact,
                items: cartData,
                total: totalAmount,
              }
            );

            if (verifyRes.data.success) {
              alert("✅ Payment Verified & Order Saved!");
              localStorage.removeItem("cartList");
              window.location.href = "/?thankyou=true";
            } else {
              alert("❌ Payment verification failed. Order saved as failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment captured, but verification failed.");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.contact,
        },
        theme: { color: "#3399cc" },
        modal: {
          // 4️⃣ Capture if user closes Razorpay popup → Save as cancelled
          ondismiss: async () => {
            try {
              await axios.post(
                `${process.env.REACT_APP_STRAPI_URL}/api/orders`,
                {
                  data: {
                    customerName: form.name,
                    email: form.email,
                    phoneNumber: form.contact,
                    items: cartData,
                    total: totalAmount,
                    status: "cancelled",
                    razorpayOrderId: order.id,
                  },
                }
              );
              alert("⚠️ Payment cancelled. Order saved as cancelled.");
            } catch (err) {
              console.error("Cancel save error:", err);
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err.message);
      // ctx.throw(500, err.message);
      alert("❌ Failed to create Razorpay order");
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

        <button onClick={createOrder}>Pay Now</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CheckoutPopup;

import React, { useState } from "react";
import { postDataToApi } from "../../utils/Api";

const Checkout = ({ cartData, onClose }) => {
  const [form, setForm] = useState({ name: "", email: "", contact: "" });

  const totalAmount = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createOrder = async () => {
    try {
      // Save order directly in Strapi as "pending"
      const orderPayload = {
        customerName: form.name,
        email: form.email,
        phoneNumber: form.contact,
        items: cartData,
        total: totalAmount,
        status: "pending", // always start with pending
      };

      await postDataToApi("/api/orders", { data: orderPayload });

      alert("✅ Order saved successfully! (Pending status)");
      localStorage.removeItem("cartList");
      window.location.href = "/?thankyou=true";
    } catch (err) {
      console.error("Order save error:", err);
      alert("❌ Failed to save order.");
    }
  };

  console.log("🛒 CheckoutPopup received cartData:", cartData);

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

        <button onClick={createOrder}>Place Order</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Checkout;

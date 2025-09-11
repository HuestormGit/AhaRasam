import React, { useState } from "react";
import axios from "axios";
import { postDataToApi } from "../../utils/Api";

const CheckoutPopup = ({ cartData, onClose }) => {
  const [form, setForm] = useState({ name: "", email: "", contact: "" });

  const totalAmount = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createOrder = async () => {
    try {
      // Step 1: Create Razorpay order from Strapi backend
      const res = await axios.post(
        `${process.env.REACT_APP_STRAPI_URL}/api/razorpay/order`,
        { amount: totalAmount, currency: "INR" }
      );
      const { order } = res.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY, // Razorpay key (frontend)
        amount: order.amount,
        currency: order.currency,
        name: "Aha Rasam",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (response) {
          try {
            // Step 3: Verify payment with backend
            const verifyRes = await axios.post(
              `${process.env.REACT_APP_STRAPI_URL}/api/razorpay/verify`,
              response
            );

            if (verifyRes.data.success) {
              // ✅ Verified → Save order as "paid"
              const orderPayload = {
                customerName: form.name,
                email: form.email,
                phoneNumber: form.contact,
                items: cartData,
                total: totalAmount,
                status: "paid",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              };

              await postDataToApi("/api/orders", { data: orderPayload });

              alert("✅ Payment Verified & Order Saved!");
              localStorage.removeItem("cartList");
              window.location.href = "/?thankyou=true";
            } else {
              // ❌ Signature mismatch → Save as failed
              const failedOrder = {
                customerName: form.name,
                email: form.email,
                phoneNumber: form.contact,
                items: cartData,
                total: totalAmount,
                status: "failed",
              };
              await postDataToApi("/api/orders", { data: failedOrder });
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

        // Step 5: Handle payment cancelled by user
        modal: {
          ondismiss: async function () {
            const cancelledOrder = {
              customerName: form.name,
              email: form.email,
              phoneNumber: form.contact,
              items: cartData,
              total: totalAmount,
              status: "cancelled",
            };
            await postDataToApi("/api/orders", { data: cancelledOrder });
            alert("⚠️ Payment was cancelled. Order saved as cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("❌ Failed to create Razorpay order");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Checkout (Online Payment)</h2>

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

import React, { useEffect, useState } from "react";
import axios from "axios";
import { postDataToApi } from "../../utils/Api";
import "./Checkout.scss";

const Checkout = ({ cartData, onClose }) => {
  const [form, setForm] = useState({ name: "", email: "", contact: "" });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const totalAmount = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // ✅ Validation Function
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!form.contact.trim()) {
      newErrors.contact = "Contact number is required";
    } else if (!/^[0-9]{10}$/.test(form.contact)) {
      newErrors.contact = "Enter a valid 10-digit number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // ✅ valid if no errors
  };

  // 🔄 Check validity whenever form changes
  useEffect(() => {
    setIsFormValid(validate());
    // eslint-disable-next-line
  }, [form]);

  const handlePayment = async () => {
    try {
      // 1️⃣ Call Strapi to create Razorpay order
      // const res = await axios.post("http://localhost:1337/api/orders/razorpay/create", {
      //   amount: totalAmount,
      // });
      const res = await axios.post("https://fantastic-flame-08d6b9922b.strapiapp.com/api/orders/razorpay/create", {
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
          await axios.post("https://fantastic-flame-08d6b9922b.strapiapp.com/api/orders/razorpay/verify", {
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
         {errors.name && <p className="error">{errors.name}</p>}
        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          value={form.email}
          onChange={handleChange}
        />
        {errors.email && <p className="error">{errors.email}</p>}
        <input
          type="text"
          name="contact"
          placeholder="Enter Contact"
          value={form.contact}
          onChange={handleChange}
        />
        {errors.contact && <p className="error">{errors.contact}</p>}
        <button onClick={handlePayment} disabled={!isFormValid}>Pay with Razorpay</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Checkout;

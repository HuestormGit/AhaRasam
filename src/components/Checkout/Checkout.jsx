import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Checkout.scss";

const Checkout = ({ cartData, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [processing, setProcessing] = useState(false);

  const totalAmount = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // ✅ Validation Function
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.contact.trim()) newErrors.contact = "Contact number is required";
    else if (!/^[0-9]{10}$/.test(form.contact)) newErrors.contact = "Enter a valid 10-digit number";

    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    // state & pincode optional; add validation if you need
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔄 Check validity whenever form changes
  useEffect(() => {
    setIsFormValid(validate());
    // eslint-disable-next-line
  }, [form]);

  const handlePayment = async () => {
    if (!validate()) return;

    if (!cartData.length) {
      alert("Cart is empty!");
      return;
    }

    try {
      setProcessing(true);

      // 1️⃣ Create Razorpay order on Strapi (backend endpoint)
      // note: your backend expects amount in the body (you were sending totalAmount)
      const createRes = await axios.post(
        "https://fantastic-flame-08d6b9922b.strapiapp.com/api/orders/razorpay/create",
        { amount: totalAmount }
      );

      const { id: razorpayOrderId, amount } = createRes.data.data || {};

      if (!razorpayOrderId) {
        throw new Error("Failed to create razorpay order on server");
      }

      // 2️⃣ Razorpay Checkout options
      // Razorpay's client "amount" should be in paise. If your backend already returns paise, use it.
      // Here we use `amount` returned from backend (assumed correct). If backend returned rupees,
      // you could send amount * 100 here.
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: amount, // use backend returned amount (preferable)
        currency: "INR",
        name: "AHA! Rasam",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // 3️⃣ Verify payment and save order in Strapi
            await axios.post(
              "https://fantastic-flame-08d6b9922b.strapiapp.com/api/orders/razorpay/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  customerName: form.name,
                  email: form.email,
                  phoneNumber: form.contact,
                  address: form.address,
                  city: form.city,
                  state: form.state,
                  pincode: form.pincode,
                  totalAmount,
                  items: cartData,
                },
              }
            );

            alert("✅ Payment successful & order saved!");
            localStorage.removeItem("cartList");
            window.location.href = "/?thankyou=true";
          } catch (verifyErr) {
            console.error("Verify/save failed:", verifyErr.response || verifyErr);
            alert("Payment was successful but saving the order failed. Check console.");
          }
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
      console.error("❌ Payment error:", err.response || err);
      alert("Something went wrong during payment creation. Check console.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Checkout</h2>

        <ul>
          {cartData.map((item, idx) => (
            <li key={idx}>
              {item.productName} ({item.size}) - ₹{item.price} × {item.qty} = ₹{item.price * item.qty}
            </li>
          ))}
        </ul>
        <h3>Total: ₹{totalAmount}</h3>

        <input type="text" name="name" placeholder="Enter Name" value={form.name} onChange={handleChange} />
        {errors.name && <p className="error">{errors.name}</p>}

        <input type="email" name="email" placeholder="Enter Email" value={form.email} onChange={handleChange} />
        {errors.email && <p className="error">{errors.email}</p>}

        <input type="text" name="contact" placeholder="Enter Contact" value={form.contact} onChange={handleChange} />
        {errors.contact && <p className="error">{errors.contact}</p>}

        <input type="text" name="address" placeholder="Address (Street / House No.)" value={form.address} onChange={handleChange} />
        {errors.address && <p className="error">{errors.address}</p>}

        <input type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} />
        {errors.city && <p className="error">{errors.city}</p>}

        <input type="text" name="state" placeholder="State" value={form.state} onChange={handleChange} />
        <input type="text" name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} />

        <button onClick={handlePayment} disabled={!isFormValid || processing}>
          {processing ? "Creating Payment..." : `Pay ₹${totalAmount}`}
        </button>
        <button onClick={onClose} disabled={processing}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Checkout;
